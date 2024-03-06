import { CheckCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/20/solid';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import React,{useState} from 'react'
import { firestore } from '../firebase/FirebaseConfig';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { cartTotalAtom } from '../store/atoms/totalCartQuantity';

const CartItem = (props) => {
    const [editable, setEditable] = useState(false);
    const [quantity, setQuantity] = useState(props.product.quantity)
    const navigate = useNavigate();
    const [cartTotal, setCartTotal] = useRecoilState(cartTotalAtom);

    const handleEditClick = () => {
    setEditable(true);
    };

    const handleSaveClick = async() => {
    setEditable(false);
    //changing the quantity in db
    if(quantity>0){
    try {
            const cartRef = collection(firestore, 'carts');
            const q = query(cartRef, where("userId", "==", localStorage.getItem('userId')));
            const querySnapshot = await getDocs(q);
            const currdoc = querySnapshot.docs[0];
            const itemsCollection = collection(firestore,"carts",currdoc.id,"items");
            const itemq = query(itemsCollection,where("productId","==",props.product.productId),where("variantId","==",props.product.variantId))
            const docSnap = await getDocs(itemq);
            const itemDoc = doc(firestore,"carts",currdoc.id,"items",docSnap.docs[0].id)
            await updateDoc(itemDoc, {
                quantity : quantity
            }) 
            props.updateCart(props.index,quantity);
            setCartTotal(cartTotal+quantity);
        }catch(err) {
            console.error(err)
        }
    }else {
        alert("Invalid quantity")
    }

    };

    const deleteCartItem = async() => {
        try {
        const cartRef = collection(firestore, 'carts');
            const q = query(cartRef, where("userId", "==", localStorage.getItem('userId')));
            const querySnapshot = await getDocs(q);
            console.log();
            const currdoc = querySnapshot.docs[0];
            const itemsCollection = collection(firestore,"carts",currdoc.id,"items");
            console.log(currdoc.id)
            const itemq = query(itemsCollection,where("productId","==",props.product.productId),where("variantId","==",props.product.variantId))
            const itemDoc = await getDocs(itemq);
            console.log(itemDoc.docs[0].id);
            const docDel = doc(firestore,"carts", currdoc.id, "items", itemDoc.docs[0].id)
                await deleteDoc(docDel)
                setCartTotal(cartTotal-quantity);
                setQuantity(0);
                props.deletedCartItem(props.index);
        }catch(err){
            console.error(err)
        }

    }

  return (
        <div> 
                <div className="h-40 md:h-36 lg:h-32 flex md:grid grid-cols-8 mb-6 rounded-lg border px-2 py-2">
                    <img src={props.product.productImage} alt="product-image" className="w-24 h-auto col-span-2  md:col-span-1 box-border md:h-full p-2 rounded-lg" />
                    <div className="col-span-6 md:col-span-7 lg:grid grid-cols-7 sm:mx-4  w-full sm:justify-between">
                        <div className="mt-2 lg:mt-5 sm:mt-0 flex flex-col col-span-3 justify-center">
                        <h2 className="text-xl font-normal text-black hover:underline cursor-pointer" onClick={() =>{navigate(`/product/${props.product.productId}`)}}>{props.product.productTitle} : {props.product.variantName}</h2>
                        <p className="mt-1 text-xl text-gray-600">Variant: <span className=' text-xl text-black font-medium'>{props.product.variantName}</span></p>
                        </div>
                        <h2 className='hidden text-xl lg:flex text-black font-medium justify-center items-center'>₹{props.product.discountPrice}</h2>
                        <h2 className='hidden text-xl lg:flex text-green-600 font-medium justify-center items-center'>₹{props.product.price- props.product.discountPrice}</h2>
                        <div className="hidden mt-4 lg:flex flex-col  justify-center items-center sm:mt-0">
                        <div className="flex gap-1 items-center border-gray-100">
                            {!editable ? (<PencilIcon className='h-6 w-6 self-end mb-1' onClick={handleEditClick} />) 
                            : <div className='h-6 w-6 self-end mb-1'> </div>
                            }
                            <div className='flex flex-col gap-1 items-center'>
                            <label htmlFor="quantity" className='text-md font-medium'>Qty</label>
                                <input
                                type='number' 
                                id='quantity'
                                name='quantity'
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className='w-12 p-2 rounded-lg text-center'
                                disabled={!editable}
                                />
                             </div>
                                {editable ? (<CheckCircleIcon className='h-6 w-6 self-end mb-1' onClick={handleSaveClick} />)
                                : <div className='h-6 w-6 self-end mb-1'> </div>
                                }
                        </div>
                        {editable && (<p className='text-xs'>Click to save</p>)}
                        </div>
                        <div className='hidden lg:flex justify-center items-center cursor-pointer' >
                        <TrashIcon className=' mb-1 h-7 w-auto text-red-600 hover:text-red-500' onClick={deleteCartItem} />
                        {/* responsive mobile */}
                        </div>
                        <div className='flex lg:hidden justify-around w-full'>
                            <h2 className=''><span>You Pay</span><span className='text-xl text-black font-medium flex justify-center items-center'>₹{props.product.discountPrice} </span></h2>
                            <h2 className=''><span>You Save</span><span className='text-xl text-green-600 font-medium flex justify-center items-center'>₹{props.product.price- props.product.discountPrice}</span></h2>
                            <div className="flex gap-1 items-center border-gray-100">
                                {!editable ? (<PencilIcon className='h-6 w-6 self-end mb-1' onClick={handleEditClick} />) 
                                : <div className='h-6 w-6 self-end mb-1'> </div>
                                }
                                <div className='flex flex-col gap-1 items-center'>
                                <label htmlFor="quantity" className='text-md font-medium'>Qty</label>
                                    <input
                                    type='number' 
                                    id='quantity'
                                    name='quantity'
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className='w-12 p-2 rounded-lg text-center'
                                    disabled={!editable}
                                    />
                                </div>
                                    {editable ? (<CheckCircleIcon className='h-6 w-6 self-end mb-1' onClick={handleSaveClick} />)
                                    : <div className='h-6 w-6 self-end mb-1'> </div>
                                    }
                            </div>
                            <TrashIcon className=' mb-1 h-7 w-auto text-red-600 hover:text-red-500' onClick={deleteCartItem} />

                        </div>
                    </div>
                </div>
        </div>
  )
}

export default CartItem
