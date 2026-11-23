const servicesCatalog = [
  { id: 'srv-1', category: 'home-visit', name: 'Doctor at Home', price: 1200, duration: '45 mins' },
  { id: 'srv-2', category: 'home-visit', name: 'Wound Dressing & Injections', price: 650, duration: '30 mins' },
  { id: 'srv-3', category: 'long-term-care', name: '24-Hour Critical ICU Care', price: 4500, duration: '24 hours' },
  { id: 'srv-4', category: 'home-diagnostics', name: 'Comprehensive Health Checkup', price: 1999, duration: 'Home Collection' },
  { id: 'srv-5', category: 'rehab-services', name: 'Post-Stroke Rehabilitation', price: 1500, duration: '60 mins' },
];

exports.getAllServices = (req, res) => {
  const { category } = req.query;
  let result = servicesCatalog;
  if (category) {
    result = result.filter(s => s.category === category);
  }
  res.status(200).json({ success: true, count: result.length, data: result });
};
