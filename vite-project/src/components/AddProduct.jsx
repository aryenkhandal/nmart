import React, {useState, Fragment, useEffect} from 'react';
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/20/solid';
import {storage, firestore} from "../firebase/FirebaseConfig";
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { z } from "zod";

const AddProduct = () => {

    
    const [title,setTitle] = useState("");
    const [description,setDescription] = useState("");
    const [selectedCategory,setSelectedCategory] = useState();
    const [categories,setCategories] = useState();
    const [variations,setVariations] = useState([]);
    const [quantity,setQuantity] = useState([]);
    const [price,setPrice] = useState([]);
    const [discounted_price,setDiscounted_price] = useState([]);
    const [tags,setTags] = useState([]);
    const [image,setImage] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const [voucher,setVoucher] = useState("");
    const [brand,setBrand] = useState("");
    const [loading, setLoading] = useState(false);
    const [visible,setVisible] = useState(true);

    useEffect(() => {
        getCategory();
    },[]);

    //zod schema verification
    const URLRegex = /^(ftp|http|https):\/\/[^ "]+$/;

    const ProductSchema = z.object({
        title: z.string().min(1).max(100), // Ensuring title length is between 1 and 100 characters
        description: z.string().min(1), // Ensuring description is not empty
        category: z.string().min(1), // Ensuring category is not empty
        tags: z.array(z.string()).max(10), // Allowing up to 10 tags
        image: z.array(z.string().refine(url => URLRegex.test(url), { message: "Invalid URL format" })).min(1), // Validating URL format for images
        voucher: z.string().optional(), // Optional voucher field
        brand: z.string().min(1), // Ensuring brand is not empty
        visible: z.boolean()
    });

    const VariationSchema = z.object({
    name: z.string().min(1).max(50), // Ensuring variation name length is between 1 and 50 characters
    quantity: z.number().int().min(0), // Ensuring quantity is a non-negative integer
    price: z.number().min(0), // Ensuring price is a non-negative number
    discountPrice: z.number().min(0), // Optional discount price, ensuring it's a non-negative number
});


    const getCategory = async() => {
        const querySnapshot = await getDocs(collection(firestore,"categories"));
        const extractedNames = querySnapshot.docs.map(doc => doc.id);
        setCategories(extractedNames);
    }

    const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...image, ...files];
    setImage(newImages);

    const previews = newImages.map((file) => URL.createObjectURL(file));
    setImagePreview(previews);
  };

    const addTag = (e) => {
        if (e.key === "Enter") {
            if (e.target.value.length > 0) {
                setTags([...tags, e.target.value]);
                e.target.value = "";
            }
        }
    };

    const removeTag = (removedTag) => {
        const newTags = tags.filter(
            (tag) => tag !== removedTag
        );
        setTags(newTags);
    };

    const addVariation = (e) => {
        if (e.key === "Enter") {
            if (e.target.value.length > 0) {
                setVariations([...variations, e.target.value]);
                e.target.value = "";
            }
        }
    };

    const removeVariation = (removedVariation) => {
        const newarr = [];
        let indx = -1;
        for(let i=0;i<variations.length ;i++){
            if(variations[i] === removedVariation){
                indx = i;
                continue;
            }
            newarr.push(variations[i]);
        }
        setVariations(newarr);

        const newQ = quantity.filter((q,i) => i !== indx );
        setQuantity(newQ);
        const newP = price.filter((q,i) => i !== indx );
        setQuantity(newP);
        const newSP = discounted_price.filter((q,i) => i !== indx );
        setQuantity(newSP);
    };
    //  addproduct
    const handleAddProducts = async(e) => {
        e.preventDefault();
        setLoading(true);
        const prodRef = collection(firestore, "products");
        const variationRef = collection(firestore, "variations");
        try {

        let imgUrls=[];
        for(let i=0;i<image.length ;i++){
            const imgRef = ref(storage, `product-images/${selectedCategory}/${image[i].name}` );
            await uploadBytes(imgRef, image[i]);
            const url = await getDownloadURL(imgRef);
            imgUrls.push(url);
        }
        
        
        try{
            const validatedProduct = ProductSchema.parse({
                title: title,
                description: description,
                category : selectedCategory,
                tags: tags,
                image : imgUrls,
                voucher: voucher,
                brand : brand,
                visible : visible,
            });
            try{
                const variationDataArray = variations.map((variation, index) => ({
                name: variation[index],
                quantity: quantity[index],
                price: price[index],
                discountPrice: discounted_price[index]
                }));

                const validatedVariations = VariationSchema.array().parse(variationDataArray);
                const docRef = await addDoc(prodRef, validatedProduct);
                const variationsCollection = collection(firestore, "products",docRef.id,"variations");
                for (const variation of validatedVariations){
                    const variationdocRef = await addDoc(variationsCollection, variation);
                }
                setLoading(false);
                alert("Product added");
                setTitle("");
                setDescription("");
                setSelectedCategory(undefined);
                setVariations([]);
                setBrand("");
                setPrice([]);
                setDiscounted_price([]);
                setQuantity([]);
                setVoucher("");
                setTags([]);
                setImage([]);
                setImagePreview([]);
                
            }catch(variationError){
                alert("Variation data is invalid", variationError.message);
                setLoading(false)
            }

        }catch(prodError){
            console.log(prodError)
            alert("Product data is invalid", prodError);
            setLoading(false)
        }

    } catch(e) {
        console.error(e);
        setLoading(false);
    }
}

  return (
    <div className="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5">
        <div className="md:col-span-5">
            <label htmlFor="title">Title</label>
            <input type="text" name="title" id="title" className="h-10 border mt-1 rounded px-4 w-full bg-gray-50" value={title || ''} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="md:col-span-5">
            <label htmlFor="description">Description</label>
            <textarea type="text" name="description" id="description" className="border mt-1 rounded px-4 w-full bg-gray-50" value={description || ''} onChange={(e) => setDescription(e.target.value)} placeholder="Product Description" rows={4} cols={50} />
        </div>

        <div className="md:col-span-5">
            <label htmlFor="category">Category</label>
            {categories && 
                <Listbox value={selectedCategory === undefined ? "loading..." : selectedCategory} onChange={setSelectedCategory}>
                    <div className="relative mt-1">
                    <Listbox.Button className="cursor-pointer relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                        <span className="block truncate">{selectedCategory}</span>
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
                        {categories.map((cat, catIdx) => (
                            <Listbox.Option
                            key={catIdx}
                            className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-amber-100 text-black' : 'text-gray-900'
                                }`
                            }
                            value={cat}
                            >
                            {({ categories }) => (
                                <>
                                <span
                                    className={`block truncate ${
                                    categories ? 'font-medium' : 'font-normal'
                                    }`}
                                >
                                    {cat}
                                </span>
                                {categories ? (
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
            }   
        </div>
        {/* variations */}
        <div className="md:col-span-5">
            <label htmlFor="variations">Variations</label>
            <input
                name='variations'
                id='variations'
                className='w-full py-2.5 px-3 rounded-md mb-2 bg-white'
                placeholder="Enter text and click Enter to add"
                onKeyDown={addVariation}
            />
            <div className='gap-2'>
                {variations?.map((variation, index) => {
                    return (
                        <div key={index} className="flex bg-gray-200   m-1 p-2 rounded-se-2xl rounded-es-2xl grid grid-cols-5 gap-2  ">
                            <div className='col-span-1'>
                                <label htmlFor="variant">Variant</label>
                                <input type="text" name="variant" id="variant" className="transition-all flex items-center h-10 border mt-1 rounded px-4 w-full bg-gray-50" placeholder="" value={variation} readOnly/>
                            </div>
                            <div className='col-span-1'>
                                <label htmlFor="quantity">Quantity</label>
                                <input type="number" name="quantity" id="quantity" className="transition-all flex items-center h-10 border mt-1 rounded px-4 w-full bg-gray-50" placeholder="" value={quantity[index] || ''} required onChange={(e) => {
                                    const newArray = [...quantity];
                                    newArray[index] = parseInt(e.target.value);
                                    console.log(newArray);
                                    setQuantity(newArray);
                                }} />
                            </div>
                            <div className='col-span-1'>
                                <label htmlFor="price">Price</label>
                                <input type="number" name="price" id="price" className="transition-all flex items-center h-10 border mt-1 rounded px-4 w-full bg-gray-50" placeholder="" value={price[index] || ''} required onChange={(e) => {
                                    const newArray = [...price];
                                    newArray[index] = parseInt(e.target.value);
                                    console.log(newArray);
                                    setPrice(newArray);
                                }} />
                            </div>
                            <div className='col-span-1'>
                                <label htmlFor="salePrice">Sale Price</label>
                                <input type="salePrice" name="salePrice" id="salePrice" className="transition-all flex items-center h-10 border mt-1 rounded px-4 w-full bg-gray-50" placeholder="" value={discounted_price[index] || ''} required onChange={(e) => {
                                    const newArray = [...discounted_price];
                                    newArray[index] = parseInt(e.target.value);
                                    console.log(newArray);
                                    setDiscounted_price(newArray);
                                }} />
                            </div>

                            <XMarkIcon
                                onClick={() => removeVariation(variation)}
                                className='h-4 w-4 cursor-pointer justify-self-end' />
                        </div>
                    );
                })}
            </div>
        </div>
        {/* brand */}
        <div className="md:col-span-1">
            <label htmlFor="brand">Brand</label>
            <input type="text" name="brand" id="brand" className="transition-all flex items-center h-10 border mt-1 rounded px-4 w-full bg-gray-50" placeholder="" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        {/* quantity */}
        <div className="md:col-span-2 gap-4 grid grid-cols-3">
            <div className="md:col-span-2">
            <label htmlFor="Voucher">Voucher</label>
            <input type="text" name="voucher" id="voucher" className="transition-all flex items-center h-10 border mt-1 rounded px-4 w-full bg-gray-50" placeholder="" value={voucher ||''} onChange={(e) => setVoucher(e.target.value)} />
        </div>
        </div>

        <div className="md:col-span-5">
            <div className="inline-flex items-center">
            <input type="checkbox" name="visible" id="visible" onChange={(e) => setVisible(e.target.checked)} checked={visible} className="htmlForm-checkbox" />
            <label htmlFor="visible" className="ml-2">Make the product visible on website</label>
            </div>
        </div>


        <div className='md:col-span-5'>
            <input
                className='w-full py-2.5 px-3 rounded-md mb-2 bg-white'
                placeholder="Type a tag and press enter"
                onKeyDown={addTag}
            />
            <div className='flex gap-2'>
                {tags?.map((Tag, index) => {
                    return (
                        <div key={index} className="flex bg-white   m-1 p-2 rounded-se-2xl rounded-es-2xl  ">
                            <span className='mt-1 bg-gray-400 px-2 py-1 rounded-xl'>{Tag}</span>
                            <XMarkIcon
                                onClick={() => removeTag(Tag)}
                                className='h-4 w-4 cursor-pointer' />
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="md:col-span-5">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="file_input">Upload file</label>
            <input className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" id="file_input" type="file" multiple accept="image/jpg,image/jpeg,image/png,image/PNG" onChange={handleImageChange} />
        </div>
        <div className='md:col-span-5 p-4 bg-gray-200'>
            <div className=' grid grid-cols-5 gap-2'>
                {imagePreview.map((preview, index) => (
                <img key={index} src={preview} alt={`Product Preview ${index}`} className='w-20 h-20' />
                ))}
            </div>
            <button className='underline pt-2 w-full text-right' onClick={() => {
                setImage([]);
                setImagePreview([])}}>Clear All</button>
        </div>

        <div className="md:col-span-5 text-right">
            <div className="inline-flex items-end">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleAddProducts}>Submit</button>
            </div>
        </div>

    </div>
  )
}

export default AddProduct
