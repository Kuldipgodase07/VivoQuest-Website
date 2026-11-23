const fs = require('fs');

['discharge-planner.html', 'health-plan.html', 'remote-desk.html'].forEach(f => {
  const p = 'vivoquest-frontend/public/screens/' + f;
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    console.log(`\n=== ${f} ===`);
    console.log('Has <aside:', content.includes('<aside'));
    console.log('Has class="side":', content.includes('class="side"'));
    console.log('Body starts with:');
    const bodyMatch = content.match(/<body[^>]*>([\s\S]{0,400})/);
    console.log(bodyMatch ? bodyMatch[0] : 'None');
  }
});
