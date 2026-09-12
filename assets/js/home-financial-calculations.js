(function() {
  function fsNum(id) { var el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; }
  function fsFmt(n) { return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fsCalc() {
    var inc = fsNum('fs-i9') + fsNum('fs-i10') + fsNum('fs-i11') + fsNum('fs-i12') + fsNum('fs-i13') + fsNum('fs-i14') + fsNum('fs-i15');
    var exp = fsNum('fs-e19') + fsNum('fs-e20') + fsNum('fs-e21') + fsNum('fs-e22') + fsNum('fs-e23') + fsNum('fs-e24') + fsNum('fs-e25') + fsNum('fs-e26') + fsNum('fs-e27') + fsNum('fs-e28') + fsNum('fs-e29') + fsNum('fs-e30') + fsNum('fs-e31') + fsNum('fs-e32');
    var prop = fsNum('fs-p35') + fsNum('fs-p36') + fsNum('fs-p37') + fsNum('fs-p38') + fsNum('fs-p39') + fsNum('fs-p40') + fsNum('fs-p41') + fsNum('fs-p42') + fsNum('fs-p43');
    var sup  = fsNum('fs-super-total');
    var liab = fsNum('fs-l48') + fsNum('fs-l49') + fsNum('fs-l51') + fsNum('fs-l52') + fsNum('fs-l53') + fsNum('fs-l54');
    var res  = fsNum('fs-resources-total');
    var set = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = fsFmt(val); };
    set('fs-income-total', inc); set('fs-expense-total', exp); set('fs-property-total', prop); set('fs-liab-total', liab);
    set('fs-sum-a', inc); set('fs-sum-b', exp); set('fs-sum-c', prop); set('fs-sum-d', sup); set('fs-sum-e', liab); set('fs-sum-f', res);
  }
  document.addEventListener('input', function(e) {
    if (e.target && e.target.id && e.target.id.match(/^fs-(i|e|p|l)/)) fsCalc();
    if (e.target && (e.target.id === 'fs-super-total' || e.target.id === 'fs-resources-total')) fsCalc();
  });
})();
