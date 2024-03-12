import React,{useEffect, useState} from 'react';
import Item from './Item';
import { firestore } from '../firebase/FirebaseConfig';
import { getDocs, collection, query,  where } from 'firebase/firestore';
import Loader from './Loader';

const ProductGrid = (props) => {
    const [loading, setLoading] = useState(false);

    const [products, setProducts] = useState([]);

    useEffect(() =>  {
      setLoading(true);
      if(props.subcategoryName.length > 0){
        getAllProducts(props.subcategoryName)
      }else{
     getAllProducts(props.selectedCategory);
      }
},[props.selectedCategory, props.subcategoryName]);

const getAllSubcategories = async (categoryName) => {
  // Array to store subcategories
  let subcategories = [categoryName];

  // Function to fetch subcategories recursively
  const fetchSubcategories = async (parent) => {
    const categoriesRef = collection(firestore,"categories");
    const q = query(categoriesRef, where("parent","==",parent));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      const categoryData = doc.data();
      const categoryName = categoryData.name;
      subcategories.push(categoryName);

      // Recursively fetch subcategories
      fetchSubcategories(categoryName);
    });
  };

  // Start fetching subcategories recursively
  await fetchSubcategories(categoryName);
 

  return subcategories;
};

const getAllProducts = async(categoryName) => {
  let subcategories = await getAllSubcategories(categoryName);
   console.log(subcategories)
  if(subcategories.length>0){
  const prodRef = collection(firestore,"products");
  const q = query(prodRef, where("category","in",[...subcategories]));
  const querySnapshot = await getDocs(q);
  const newData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(newData)
    setProducts(newData);
  }
  setLoading(false);
}
  return (
    <section className=" w-full px-2 auto-cols-auto lg:w-3/4 xl:pr-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 justify-items-center justify-center gap-y-10 sm:gap-y-20 gap-x-4 mt-10 mb-5">
    {loading && <Loader />}
                {products.map((item,index) => (
                      <Item key={index} title={item.title} image={item.image} brand={item.brand} product={item.product} id={item.id} />
                  ))}
    </section>
  )
}

export default ProductGrid
