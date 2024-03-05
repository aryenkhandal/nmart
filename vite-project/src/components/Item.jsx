import { collection, doc, getDoc, getDocs, query, where, addDoc, arrayUnion, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import React, { useEffect, useState, Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { firestore } from '../firebase/FirebaseConfig';
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, TrashIcon } from '@heroicons/react/20/solid'
import { ShoppingCartIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Item = (props) => {
    
    const [variations, setVariations] = useState([]);
    const [selectedVariant, setSelectedVariant ] = useState();
    const [quantity, setQuantity] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        getVariationData();
    },[]);


    const getVariationData = async() => {
        const docRef = collection(firestore, "products", props.id,"variations");
        const docSnap = await getDocs(docRef);
        const newData = docSnap.docs.map(doc => ({ variationId: doc.id, ...doc.data() }));

            setVariations(newData);
            setSelectedVariant(newData[0]);
            // console.log(newData[0].variationId)
            getQuantity(newData[0].variationId);
    }

    const getQuantity = async(variationid) => {
        console.log(variationid);
        console.log(props.id);
        const cartRef = collection(firestore, 'carts');
            const q = query(cartRef, where("userId", "==", localStorage.getItem('userId')));
            const querySnapshot = await getDocs(q);
            const currdoc = querySnapshot.docs[0];
            const itemsCollection = collection(firestore,"carts",currdoc.id,"items");
            const itemq = query(itemsCollection,where("productId","==",props.id),where("variantId","==",variationid))
            const docSnap = await getDocs(itemq);
            if(docSnap.docs[0]){
            setQuantity(docSnap.docs[0].data().quantity);}
            else{
                setQuantity(0);
            }


    }

    const handleVariantChange = (v) => {
    // Example: Update price based on the selected variant
        let i = -1;
        for(let j =0;j< variations.length ;j++){
        if(variations[j].name === v){
            i=j;
            break;
        }
        }
        setSelectedVariant(variations[i]);
        console.log(variations[i].variationId)
        getQuantity(variations[i].variationId);
    };

    const addToCart = async() => {
        try {
        const cartRef = collection(firestore, 'carts');
        if(localStorage.getItem('userId')){
            const q = query(cartRef, where("userId", "==", localStorage.getItem('userId')));
            const querySnapshot = await getDocs(q);
            if(querySnapshot.empty){

                        const docRef = await addDoc(cartRef,{
                            userId : localStorage.getItem('userId')
                        })

                        const itemsCollection = collection(firestore,"carts",docRef.id,"items");
                        const itemRef = await addDoc(itemsCollection, {
                            productId : props.id,
                            variantId : selectedVariant.variationId,
                            quantity: 1,
                            productImage : props.image,
                            productTitle : props.title,
                            price : selectedVariant.price,
                            discountPrice : selectedVariant.discountPrice,
                            variantName : selectedVariant.name,
                            productBrand : props.brand

                        })

            }
            else {
                console.log("inside else")
                const currdoc = querySnapshot.docs[0];
                console.log(currdoc.id);
                const existingItemsCollection = collection(firestore, 'carts', currdoc.id, "items");
                const itemRef = await addDoc(existingItemsCollection, {
                            productId : props.id,
                            variantId : selectedVariant.variationId,
                            quantity: 1,
                            productImage : props.image,
                            productTitle : props.title,
                            price : selectedVariant.price,
                            discountPrice : selectedVariant.discountPrice,
                            variantName : selectedVariant.name,
                            productBrand : props.brand

                        })
                } 
                setQuantity(1); 
        
        }else {
            alert("Sign in first");
        }
        }catch(err){
            console.error(err)
        }
    }

    const deleteCartItem = async() => {
        try {
        const cartRef = collection(firestore, 'carts');
            const q = query(cartRef, where("userId", "==", localStorage.getItem('userId')));
            const querySnapshot = await getDocs(q);
            console.log();
            const currdoc = querySnapshot.docs[0];
            const itemsCollection = collection(firestore,"carts",currdoc.id,"items");
            console.log(currdoc.id)
            const itemq = query(itemsCollection,where("productId","==",props.id),where("variantId","==",selectedVariant.variationId))
            const itemDoc = await getDocs(itemq);
            console.log(itemDoc.docs[0].id);
            const docDel = doc(firestore,"carts", currdoc.id, "items", itemDoc.docs[0].id)
                await deleteDoc(docDel)
                setQuantity(0);
        }catch(err){
            console.error(err)
        }

    }

    const decreaseQuantity = async() => {
        try {
            const cartRef = collection(firestore, 'carts');
            const q = query(cartRef, where("userId", "==", localStorage.getItem('userId')));
            const querySnapshot = await getDocs(q);
            const currdoc = querySnapshot.docs[0];
            const itemsCollection = collection(firestore,"carts",currdoc.id,"items");
            const itemq = query(itemsCollection,where("productId","==",props.id),where("variantId","==",selectedVariant.variationId))
            const docSnap = await getDocs(itemq);
            const itemDoc = doc(firestore,"carts",currdoc.id,"items",docSnap.docs[0].id)
            await updateDoc(itemDoc, {
                quantity : increment(-1)
            })
            setQuantity(quantity-1) 
        }catch(err){
            console.error(err);
        }

    }

    const increaseQuantity = async() => {
        try {
            const cartRef = collection(firestore, 'carts');
            const q = query(cartRef, where("userId", "==", localStorage.getItem('userId')));
            const querySnapshot = await getDocs(q);
            const currdoc = querySnapshot.docs[0];
            const itemsCollection = collection(firestore,"carts",currdoc.id,"items");
            const itemq = query(itemsCollection,where("productId","==",props.id),where("variantId","==",selectedVariant.variationId))
            const docSnap = await getDocs(itemq);
            const itemDoc = doc(firestore,"carts",currdoc.id,"items",docSnap.docs[0].id)
            await updateDoc(itemDoc, {
                quantity : increment(1)
            }) 
            setQuantity(quantity+1)
        }catch(err) {
            console.error(err)
        }

    }

  return (
    
    <div className="w-full bg-white border-2 shadow-md rounded-xl">
    {selectedVariant &&
        <div className='w-full pt-4' >
            <img src={props.image} alt="Product" className="h-32 w-full object-contain rounded-t-xl cursor-pointer duration-500 hover:scale-105" onClick={() => {navigate(`/product/${props.id}`)}} />
            <div className="flex flex-col px-4 py-3">
                <span className="text-gray-400 mr-3 uppercase text-xs">{props.brand}</span>
                <p className="text-lg font-normal text-gray-600 truncate block capitalize cursor-pointer hover:underline" onClick={() => {navigate(`/product/${props.id}`)}}>{props.title} : <span>{selectedVariant.name}</span> </p>
                <div className="flex justify-around items-center">
                    <div className='flex justify-center items-center gap-2'>
                    <p className="text-xs text-gray-600 cursor-auto ml-2"><span className='font-normal block text-center'>MRP</span><span className='line-through'>₹{localStorage.getItem("userId")!=null?selectedVariant.price:""}</span></p>
                    <p className="text-sm font-semibold text-black cursor-auto my-3"><span className='font-normal block text-center'>Mart</span>₹{localStorage.getItem("userId")!=null?selectedVariant.discountPrice:""}</p>
                    </div>
                    {/* <div>
                    <p className='text-xs text-gray-500 font-medium'>You Pay</p>
                    <p>₹365</p>
                    </div> */}
                    <p className='flex flex-col justify-center items-center h-12 px-4 bg-blue-200 text-blue-800 text-center'>₹{localStorage.getItem("userId")!=null? selectedVariant.price-selectedVariant.discountPrice :""}<span className='block text-xs'> OFF </span></p>
                </div>
                <Listbox value={selectedVariant.name} onChange={handleVariantChange}>
                        <div className="relative mt-1">
                        <Listbox.Button className="cursor-pointer hover:border-2 hover:border-blue-500 relative w-full border-2 cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                            <span className="block truncate">{selectedVariant.name}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                            </span>
                        </Listbox.Button>
                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                            {variations.map((variation, indx) => (
                                <Listbox.Option
                                key={indx}
                                className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-gray-200 text-black' : 'text-gray-900'
                                    }`
                                }
                                value={variation.name}
                                >
                                {({ selectedVariant }) => (
                                    <>
                                    <span
                                        className={`block truncate ${
                                        selectedVariant ? 'font-medium' : 'font-normal'
                                        }`}
                                    >
                                        {variation.name}
                                    </span>
                                    {selectedVariant ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                    ) : null}
                                    </>
                                )}
                                </Listbox.Option>
                            ))}
                            </Listbox.Options>
                        </Transition>
                        </div>
                </Listbox>
                {quantity == 0 ?
                <button className=' mt-2 w-full rounded-md flex gap-2 py-2 justify-center items-center bg-blue-500 hover:bg-blue-400' onClick={addToCart}>
                <ShoppingCartIcon className='w-auto h-5 text-white' />
                <span className='text-white font-medium text-sm'>Add To Cart </span>
                </button>
                :
                <div className='mt-2 w-full flex justify-between items-center'>
                    <div className="flex items-center border-gray-100">
                        <button className={`${quantity==1 ? "block": "hidden"} h-8 cursor-pointer rounded-l bg-blue-500 py-1 px-3.5 duration-100 hover:bg-blue-300`} onClick={deleteCartItem}> <TrashIcon className='text-white w-auto h-4'/> </button>
                        <button className={`${quantity>1 ? "block": "hidden"} text-white cursor-pointer rounded-l bg-blue-500 py-1 px-3.5 duration-100 hover:bg-blue-300`} onClick={decreaseQuantity}> - </button>
                        <span className="h-8 w-8 border bg-white text-center text-black text-xs outline-none py-2">{quantity}</span>
                        <button disabled={quantity== 3} className={`${quantity>=3? "bg-gray-400 cursor-default":" bg-blue-500 hover:bg-blue-300" } h-8 text-white text-xl rounded-r  px-3 duration-100`} onClick={increaseQuantity}> + </button>
                    </div>
                    <div className='w-10 h-8 flex items-center justify-center border border-gray-400 cursor-pointer' onClick={deleteCartItem}><XMarkIcon className='h-5 w-auto' /></div>
                </div>
                }
                        {quantity >= 3 &&
                            <span className="w-full text-gray-400 text-xs font-normal">Max 3 items</span>
                        }
            </div>
        </div>
    }
    </div>
  )
}

export default Item
