function formatNumber(number) {
  return String(number).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

let prevTestName = '';

export function logResult(event) {
  const { name, hz } = event.target;
  const libName = name.split(':')[0];
  const testName = name.split(':')[1];

  if (prevTestName !== testName) {
    prevTestName = testName;
    console.log('');
    console.log(`  ${testName}`);
  }

  const fLibName = libName.padEnd(20);
  const fResult = formatNumber(hz.toFixed(0)).padStart(15);
  console.log(`    ${fLibName} ${fResult} ops/sec`);
}
