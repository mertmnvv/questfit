const test = async () => {
  try {
    const res = await fetch('https://world.openfoodfacts.org/api/v0/product/5449000000996.json');
    const data = await res.json();
    console.log('OpenFoodFacts Status:', data.status, 'Product:', data.product?.product_name);
  } catch (err) {
    console.error('OpenFoodFacts Error:', err);
  }
};
test();
