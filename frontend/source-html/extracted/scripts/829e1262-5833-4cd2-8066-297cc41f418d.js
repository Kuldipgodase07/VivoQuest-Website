/*!
 * VivoQuest report engine v1.0.0
 * Writes real .xlsx (OOXML) and .pdf (PDF 1.7) files in the browser or Node. No dependencies, no network.
 * Exposes: VQEngine.payX(data) VQEngine.outX(data)  -> Uint8Array (.xlsx)
 *          VQEngine.care(data) VQEngine.dis(data) VQEngine.out(data) VQEngine.inv(data) -> Uint8Array (.pdf)
 */
(function(root,factory){if(typeof module==='object'&&module.exports){module.exports=factory();}else{root.VQEngine=factory();}})(typeof self!=='undefined'?self:this,function(){
/* ---------- ZIP (store) ---------- */
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc32=(u)=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRCT[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
function zipStore(files){
  const enc=new TextEncoder();const parts=[];const cd=[];let off=0;
  const u16=(n)=>[n&255,(n>>>8)&255];const u32=(n)=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  for(const f of files){
    const nm=enc.encode(f.name);const crc=crc32(f.data);const sz=f.data.length;
    const lh=Uint8Array.from([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(33),...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),...u16(0)]);
    parts.push(lh,nm,f.data);
    cd.push(Uint8Array.from([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(33),...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nm);
    off+=lh.length+nm.length+sz;
  }
  let cdSize=0;for(const c of cd)cdSize+=c.length;
  const eocd=Uint8Array.from([0x50,0x4b,5,6,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cdSize),...u32(off),...u16(0)]);
  const all=parts.concat(cd,[eocd]);let total=0;for(const p of all)total+=p.length;
  const out=new Uint8Array(total);let o=0;for(const p of all){out.set(p,o);o+=p.length;}return out;
}
const esc=(s)=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const colName=(c)=>{let s='';while(c>0){const m=(c-1)%26;s=String.fromCharCode(65+m)+s;c=Math.floor((c-1)/26);}return s;};
const ref=(r,c)=>colName(c)+r;
const argb=(h)=>'FF'+h.replace('#','').toUpperCase();
const serial=(d)=>Math.round((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(1899,11,30))/86400000);

/* ---------- styles registry ---------- */
class Styles{
  constructor(){this.fonts=[];this.fills=[];this.borders=[];this.fmts=[];this.xfs=[];this.dxfs=[];this.k={};
    this.font({});this.fills.push('<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>');this.k['f:none']=0;this.border({});this.xf({});}
  idx(list,key,xml){const k=list===this.fonts?'F':list===this.fills?'L':list===this.borders?'B':'X';const kk=k+key;if(this.k[kk]!==undefined)return this.k[kk];list.push(xml);return (this.k[kk]=list.length-1);}
  font(s){const x='<font>'+(s.b?'<b/>':'')+(s.i?'<i/>':'')+'<sz val="'+(s.sz||11)+'"/><color rgb="'+argb(s.color||'#17143A')+'"/><name val="'+(s.name||'Calibri')+'"/><family val="2"/></font>';return this.idx(this.fonts,x,x);}
  fill(c){if(!c)return 0;const x='<fill><patternFill patternType="solid"><fgColor rgb="'+argb(c)+'"/><bgColor indexed="64"/></patternFill></fill>';return this.idx(this.fills,x,x);}
  border(s){const e=(n,v)=>v?'<'+n+' style="'+v[0]+'"><color rgb="'+argb(v[1]||'#E6E2F0')+'"/></'+n+'>':'<'+n+'/>';
    const bd=s.bd;const l=s.bl||bd,r=s.br||bd,t=s.bt||bd,b=s.bb||bd;const x='<border>'+e('left',l)+e('right',r)+e('top',t)+e('bottom',b)+'<diagonal/></border>';return this.idx(this.borders,x,x);}
  fmt(f){if(!f)return 0;const i=this.fmts.indexOf(f);if(i>=0)return 164+i;this.fmts.push(f);return 164+this.fmts.length-1;}
  xf(s){const key=JSON.stringify(s);if(this.k['X'+key]!==undefined)return this.k['X'+key];
    const x='<xf numFmtId="'+this.fmt(s.fmt)+'" fontId="'+this.font(s)+'" fillId="'+this.fill(s.fill)+'" borderId="'+this.border(s)+'" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="'+(s.h||'general')+'" vertical="'+(s.v||'center')+'"'+(s.wrap?' wrapText="1"':'')+(s.indent?' indent="'+s.indent+'"':'')+'/></xf>';
    this.xfs.push(x);return (this.k['X'+key]=this.xfs.length-1);}
  dxf(o){const x='<dxf><font>'+(o.b?'<b/>':'')+'<color rgb="'+argb(o.color)+'"/></font><fill><patternFill><bgColor rgb="'+argb(o.fill)+'"/></patternFill></fill></dxf>';this.dxfs.push(x);return this.dxfs.length-1;}
  xml(){return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    +(this.fmts.length?'<numFmts count="'+this.fmts.length+'">'+this.fmts.map((f,i)=>'<numFmt numFmtId="'+(164+i)+'" formatCode="'+esc(f)+'"/>').join('')+'</numFmts>':'')
    +'<fonts count="'+this.fonts.length+'">'+this.fonts.join('')+'</fonts><fills count="'+this.fills.length+'">'+this.fills.join('')+'</fills><borders count="'+this.borders.length+'">'+this.borders.join('')+'</borders>'
    +'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="'+this.xfs.length+'">'+this.xfs.join('')+'</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
    +'<dxfs count="'+this.dxfs.length+'">'+this.dxfs.join('')+'</dxfs></styleSheet>';}
}

/* ---------- sheet ---------- */
class Sheet{
  constructor(book,name,o){this.book=book;this.name=name;this.o=o||{};this.cells=new Map();this.merges=[];this.cw={};this.rh={};this.cf=[];this.dvs=[];this.af=null;this.charts=[];this.maxR=1;this.maxC=1;}
  set(r,c,v,s){const sid=this.book.st.xf(s||{});this.cells.set(r+','+c,{r,c,v,sid});if(r>this.maxR)this.maxR=r;if(c>this.maxC)this.maxC=c;return this;}
  style(r1,c1,r2,c2,s){for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++){if(!this.cells.has(r+','+c))this.set(r,c,null,s);}return this;}
  merge(r1,c1,r2,c2){this.merges.push(ref(r1,c1)+':'+ref(r2,c2));return this;}
  width(c,w){this.cw[c]=w;return this;}height(r,h){this.rh[r]=h;return this;}
  cellXml(x){
    const a=ref(x.r,x.c);const v=x.v;const s=' s="'+x.sid+'"';
    if(v===null||v===undefined||v==='')return '<c r="'+a+'"'+s+'/>';
    if(v instanceof Date)return '<c r="'+a+'"'+s+'><v>'+serial(v)+'</v></c>';
    if(typeof v==='number')return '<c r="'+a+'"'+s+'><v>'+v+'</v></c>';
    if(typeof v==='object'&&v.f){const cv=v.v;if(typeof cv==='number')return '<c r="'+a+'"'+s+'><f>'+esc(v.f)+'</f><v>'+cv+'</v></c>';return '<c r="'+a+'"'+s+' t="str"><f>'+esc(v.f)+'</f><v>'+esc(cv===undefined?'':cv)+'</v></c>';}
    return '<c r="'+a+'"'+s+' t="inlineStr"><is><t xml:space="preserve">'+esc(v)+'</t></is></c>';
  }
  xml(i,hasDrawing){
    const o=this.o;const rows={};for(const x of this.cells.values())(rows[x.r]=rows[x.r]||[]).push(x);
    const rk=Object.keys(rows).map(Number).sort((a,b)=>a-b);
    let sd='';for(const r of rk){const cs=rows[r].sort((a,b)=>a.c-b.c);sd+='<row r="'+r+'"'+(this.rh[r]?' ht="'+this.rh[r]+'" customHeight="1"':'')+'>'+cs.map((x)=>this.cellXml(x)).join('')+'</row>';}
    for(const r of Object.keys(this.rh).map(Number))if(!rows[r])sd+='<row r="'+r+'" ht="'+this.rh[r]+'" customHeight="1"/>';
    let cols='';const ck=Object.keys(this.cw).map(Number).sort((a,b)=>a-b);if(ck.length)cols='<cols>'+ck.map((c)=>'<col min="'+c+'" max="'+c+'" width="'+this.cw[c]+'" customWidth="1"/>').join('')+'</cols>';
    const fz=o.freeze;let view='<sheetView '+(o.grid===false?'showGridLines="0" ':'')+(i===0?'tabSelected="1" ':'')+'zoomScale="'+(o.zoom||100)+'" zoomScaleNormal="'+(o.zoom||100)+'" workbookViewId="0">';
    if(fz&&(fz.r||fz.c)){const pane=fz.r&&fz.c?'bottomRight':(fz.r?'bottomLeft':'topRight');view+='<pane '+(fz.c?'xSplit="'+fz.c+'" ':'')+(fz.r?'ySplit="'+fz.r+'" ':'')+'topLeftCell="'+ref(fz.r+1,fz.c+1)+'" activePane="'+pane+'" state="frozen"/><selection pane="'+pane+'" activeCell="'+ref(fz.r+1,fz.c+1)+'" sqref="'+ref(fz.r+1,fz.c+1)+'"/>';}
    view+='</sheetView>';
    let cfx='';let pr=1;for(const g of this.cf){cfx+='<conditionalFormatting sqref="'+g.range+'">'+g.rules.map((u)=>u.replace('PRIO',pr++)).join('')+'</conditionalFormatting>';}
    const dim=ref(1,1)+':'+ref(this.maxR,this.maxC);
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      +'<sheetPr>'+(o.tab?'<tabColor rgb="'+argb(o.tab)+'"/>':'')+'<pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="'+dim+'"/><sheetViews>'+view+'</sheetViews><sheetFormatPr defaultRowHeight="15" customHeight="0"/>'+cols
      +'<sheetData>'+sd+'</sheetData>'+(this.af?'<autoFilter ref="'+this.af+'"/>':'')+(this.merges.length?'<mergeCells count="'+this.merges.length+'">'+this.merges.map((m)=>'<mergeCell ref="'+m+'"/>').join('')+'</mergeCells>':'')+cfx+(this.dvs.length?'<dataValidations count="'+this.dvs.length+'">'+this.dvs.join('')+'</dataValidations>':'')
      +'<printOptions horizontalCentered="1"/><pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="'+(o.landscape===false?'portrait':'landscape')+'" fitToWidth="1" fitToHeight="'+(o.fitH?1:0)+'"/>'
      +'<headerFooter><oddHeader>&amp;L&amp;"Calibri,Bold"&amp;12VivoQuest&amp;R&amp;A</oddHeader><oddFooter>&amp;LConfidential. Generated by VivoQuest&amp;RPage &amp;P of &amp;N</oddFooter></headerFooter>'
      +(hasDrawing?'<drawing r:id="rId1"/>':'')+'</worksheet>';
  }
  cfStatus(range,map){const st=this.book.st;const rules=Object.keys(map).map((k)=>{const d=st.dxf(map[k]);return '<cfRule type="cellIs" dxfId="'+d+'" priority="PRIO" operator="equal"><formula>"'+esc(k)+'"</formula></cfRule>';});this.cf.push({range,rules});return this;}
  dv(range,items){this.dvs.push('<dataValidation type="list" allowBlank="0" showInputMessage="1" showErrorMessage="1" sqref="'+range+'"><formula1>"'+esc(items.join(','))+'"</formula1></dataValidation>');return this;}
  cfExpr(range,formula,color){const d=this.book.st.dxf({fill:color,color:color});this.cf.push({range,rules:['<cfRule type="expression" dxfId="'+d+'" priority="PRIO"><formula>'+esc(formula)+'</formula></cfRule>']});return this;}
  cfBar(range,color){this.cf.push({range,rules:['<cfRule type="dataBar" priority="PRIO"><dataBar><cfvo type="num" val="0"/><cfvo type="max"/><color rgb="'+argb(color||'#B9A6F5')+'"/></dataBar></cfRule>']});return this;}
  chart(c){this.charts.push(c);return this;}
}

/* ---------- chart xml ---------- */
/* ---------- charts: themed bar / combo / horizontal bar / pie / doughnut ---------- */
const THEME={ink:'17143A',mut:'5B6475',grid:'E6E2F0',axis:'C9C3DD',purples:['2E1478','4520B8','6D42E8','9B7CF0'],green:'18845B',amber:'A96513',red:'9C1C2B',grey:'6B7280'};
function chartXml(c){
  const solid=(h)=>'<a:solidFill><a:srgbClr val="'+h+'"/></a:solidFill>';
  const tx=(t,sz,b,col)=>'<c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="'+sz+'" b="'+(b?1:0)+'"/></a:pPr><a:r><a:rPr lang="en-US" sz="'+sz+'" b="'+(b?1:0)+'">'+solid(col)+'</a:rPr><a:t>'+esc(t)+'</a:t></a:r></a:p></c:rich></c:tx>';
  const txPr=(sz,col,b)=>'<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="'+sz+'" b="'+(b?1:0)+'">'+solid(col)+'</a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>';
  const cache=(arr,num)=>num?'<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="'+arr.length+'"/>'+arr.map((v,i)=>'<c:pt idx="'+i+'"><c:v>'+v+'</c:v></c:pt>').join('')+'</c:numCache>':'<c:strCache><c:ptCount val="'+arr.length+'"/>'+arr.map((v,i)=>'<c:pt idx="'+i+'"><c:v>'+esc(v)+'</c:v></c:pt>').join('')+'</c:strCache>';
  const type=c.type||'bar';const horiz=type==='hbar';const round=type==='doughnut'||type==='pie';
  const serTx=(s)=>'<c:tx><c:strRef><c:f>'+esc(s.nameRef)+'</c:f>'+cache([s.name])+'</c:strRef></c:tx>';
  const catV=(s)=>'<c:cat><c:strRef><c:f>'+esc(c.catRef)+'</c:f>'+cache(c.cats)+'</c:strRef></c:cat><c:val><c:numRef><c:f>'+esc(s.ref)+'</c:f>'+cache(s.vals,1)+'</c:numRef></c:val>';
  const dl=(s,pos,col,extra)=>'<c:dLbls><c:numFmt formatCode="'+esc(c.lblFmt||'General')+'" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>'+txPr(1000,col||THEME.ink,1)+(pos?'<c:dLblPos val="'+pos+'"/>':'')+'<c:showLegendKey val="0"/><c:showVal val="'+(extra?0:1)+'"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="'+(extra?1:0)+'"/><c:showBubbleSize val="0"/><c:showLeaderLines val="0"/></c:dLbls>';
  const dpts=(s,isBar)=>(s.ptColors||[]).map((col,i)=>'<c:dPt><c:idx val="'+i+'"/>'+(isBar?'<c:invertIfNegative val="0"/>':'')+'<c:bubble3D val="0"/><c:spPr>'+solid(col)+(round?'<a:ln w="25400">'+solid('FFFFFF')+'</a:ln>':'')+'</c:spPr></c:dPt>').join('');
  const ax=(id,cross,pos,isCat)=>isCat
   ?'<c:catAx><c:axId val="'+id+'"/><c:scaling><c:orientation val="'+(horiz?'maxMin':'minMax')+'"/></c:scaling><c:delete val="0"/><c:axPos val="'+pos+'"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln w="9525">'+solid(THEME.axis)+'</a:ln></c:spPr>'+txPr(1000,horiz?THEME.ink:THEME.mut,horiz?1:0)+'<c:crossAx val="'+cross+'"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>'
   :'<c:valAx><c:axId val="'+id+'"/><c:scaling><c:orientation val="minMax"/>'+(c.axMax!==undefined?'<c:max val="'+c.axMax+'"/>':'')+'<c:min val="0"/></c:scaling><c:delete val="'+(horiz?1:0)+'"/><c:axPos val="'+pos+'"/>'+(horiz?'':'<c:majorGridlines><c:spPr><a:ln w="6350">'+solid(THEME.grid)+'</a:ln></c:spPr></c:majorGridlines>')+'<c:numFmt formatCode="'+esc(c.axFmt||'General')+'" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>'+txPr(1000,THEME.mut,0)+'<c:crossAx val="'+cross+'"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>';
  let plot='';
  if(round){
    const s=c.series[0];const pal=s.ptColors||THEME.purples;
    s.ptColors=c.cats.map((_,i)=>pal[i%pal.length]);
    const tag=type==='doughnut'?'doughnutChart':'pieChart';
    plot='<c:'+tag+'><c:varyColors val="1"/><c:ser><c:idx val="0"/><c:order val="0"/>'+serTx(s)+dpts(s,false)+dl(s,type==='pie'?'inEnd':null,'FFFFFF',1)+catV(s)+'</c:ser><c:firstSliceAng val="0"/>'+(type==='doughnut'?'<c:holeSize val="58"/>':'')+'</c:'+tag+'>';
  }else{
    const bars=c.series.filter((s)=>s.type!=='line'),lines=c.series.filter((s)=>s.type==='line');
    let idx=0;
    const bx=bars.map((s)=>{const i=idx++;return '<c:ser><c:idx val="'+i+'"/><c:order val="'+i+'"/>'+serTx(s)+'<c:spPr>'+solid(s.color)+'</c:spPr><c:invertIfNegative val="0"/>'+dpts(s,true)+dl(s,'outEnd')+catV(s)+'</c:ser>';}).join('');
    const lx=lines.map((s)=>{const i=idx++;return '<c:ser><c:idx val="'+i+'"/><c:order val="'+i+'"/>'+serTx(s)+'<c:spPr><a:ln w="28575" cap="rnd">'+solid(s.color)+'<a:prstDash val="dash"/><a:round/></a:ln></c:spPr><c:marker><c:symbol val="none"/></c:marker>'+catV(s)+'<c:smooth val="0"/></c:ser>';}).join('');
    plot='<c:barChart><c:barDir val="'+(horiz?'bar':'col')+'"/><c:grouping val="clustered"/><c:varyColors val="0"/>'+bx+'<c:gapWidth val="'+(c.gap||60)+'"/><c:axId val="50010"/><c:axId val="50020"/></c:barChart>'
      +(lx?'<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>'+lx+'<c:marker val="1"/><c:axId val="50010"/><c:axId val="50020"/></c:lineChart>':'')
      +ax(50010,50020,horiz?'l':'b',true)+ax(50020,50010,horiz?'b':'l',false);
  }
  const legend=(round||c.series.length>1)?'<c:legend><c:legendPos val="'+(round?'r':'b')+'"/><c:overlay val="0"/>'+txPr(1000,THEME.ink,0)+'</c:legend>':'';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:roundedCorners val="0"/>'
    +'<c:chart><c:title>'+tx(c.title,1300,1,THEME.ink)+'<c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>'+plot+'<c:spPr><a:noFill/></c:spPr></c:plotArea>'+legend+'<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>'
    +'<c:spPr>'+solid('FFFFFF')+'<a:ln w="12700">'+solid(THEME.grid)+'</a:ln></c:spPr></c:chartSpace>';
}
const drawingXml=(list)=>'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'+list.map((c,i)=>'<xdr:twoCellAnchor><xdr:from><xdr:col>'+(c.at.c1-1)+'</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>'+(c.at.r1-1)+'</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>'+(c.at.c2-1)+'</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>'+(c.at.r2-1)+'</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="'+(i+2)+'" name="Chart '+(i+1)+'" descr="'+esc(c.title)+'"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId'+(i+1)+'"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>').join('')+'</xdr:wsDr>';

/* ---------- workbook ---------- */
class Book{
  constructor(meta){this.meta=meta||{};this.st=new Styles();this.sheets=[];this.names=[];}
  sheet(name,o){const s=new Sheet(this,name,o);this.sheets.push(s);return s;}
  build(){
    const enc=new TextEncoder();const files=[];const add=(n,x)=>files.push({name:n,data:enc.encode(x)});
    const m=this.meta;const now=new Date().toISOString().replace(/\.\d+Z$/,'Z');
    let ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>';
    let wbRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
    let wbSheets='';let dn='';let chartN=0;let drawN=0;
    this.sheets.forEach((s,i)=>{
      const n=i+1;const hasD=s.charts.length>0;
      ct+='<Override PartName="/xl/worksheets/sheet'+n+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      wbRels+='<Relationship Id="rId'+n+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+n+'.xml"/>';
      wbSheets+='<sheet name="'+esc(s.name)+'" sheetId="'+n+'" r:id="rId'+n+'"/>';
      add('xl/worksheets/sheet'+n+'.xml',s.xml(i,hasD));
      if(hasD){
        drawN++;const cs=s.charts;
        add('xl/worksheets/_rels/sheet'+n+'.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing'+drawN+'.xml"/></Relationships>');
        add('xl/drawings/drawing'+drawN+'.xml',drawingXml(cs));
        let rel='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
        ct+='<Override PartName="/xl/drawings/drawing'+drawN+'.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>';
        cs.forEach((c,k)=>{chartN++;rel+='<Relationship Id="rId'+(k+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart'+chartN+'.xml"/>';add('xl/charts/chart'+chartN+'.xml',chartXml(c));ct+='<Override PartName="/xl/charts/chart'+chartN+'.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>';});
        add('xl/drawings/_rels/drawing'+drawN+'.xml.rels',rel+'</Relationships>');
      }
      if(s.o.printTitles)dn+='<definedName name="_xlnm.Print_Titles" localSheetId="'+i+'">'+esc("'"+s.name+"'")+'!$'+s.o.printTitles+':$'+s.o.printTitles+'</definedName>';
      if(s.af){const a=s.af.split(':');const abs=(x)=>x.replace(/([A-Z]+)(\d+)/,'$$$1$$$2');dn+='<definedName name="_xlnm._FilterDatabase" localSheetId="'+i+'" hidden="1">'+esc("'"+s.name+"'")+'!'+abs(a[0])+':'+abs(a[1])+'</definedName>';}
    });
    const ns=this.sheets.length;
    wbRels+='<Relationship Id="rId'+(ns+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    ct+='</Types>';
    add('[Content_Types].xml',ct);
    add('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>');
    add('xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="16000" tabRatio="800"/></bookViews><sheets>'+wbSheets+'</sheets>'+(dn?'<definedNames>'+dn+'</definedNames>':'')+'<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>');
    add('xl/_rels/workbook.xml.rels',wbRels);
    add('xl/styles.xml',this.st.xml());
    add('docProps/core.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>'+esc(m.title||'VivoQuest report')+'</dc:title><dc:subject>'+esc(m.subject||'')+'</dc:subject><dc:creator>'+esc(m.author||'VivoQuest')+'</dc:creator><cp:keywords>'+esc(m.keywords||'')+'</cp:keywords><dcterms:created xsi:type="dcterms:W3CDTF">'+now+'</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">'+now+'</dcterms:modified></cp:coreProperties>');
    add('docProps/app.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>VivoQuest Reports</Application><Company>'+esc(m.company||'VivoQuest')+'</Company></Properties>');
    return zipStore(files);
  }
}

/* ---------- Excel report definitions ---------- */
const C={P:'#4520B8',ACC:'#6D42E8',LAV:'#EAE4FF',BG:'#F7F5FF',INK:'#17143A',MUT:'#5B6475',LINE:'#E6E2F0',ALT:'#FAF9FE',G:'#0F6B47',GB:'#DDF3EA',A:'#8A500F',AB:'#FDEFD6',R:'#9C1C2B',RB:'#FBE4E7',N:'#4B5565',NB:'#EEEBF5',W:'#FFFFFF'};
const STATUS_DXF={'Captured':{fill:'#DDF3EA',color:'#0F6B47',b:1},'Processed':{fill:'#DDF3EA',color:'#0F6B47',b:1},'On target':{fill:'#DDF3EA',color:'#0F6B47',b:1},'Failed':{fill:'#FBE4E7',color:'#9C1C2B',b:1},'Needs action':{fill:'#FBE4E7',color:'#9C1C2B',b:1},'Refunded':{fill:'#FDEFD6',color:'#8A500F',b:1},'Initiated':{fill:'#FDEFD6',color:'#8A500F',b:1},'Watch':{fill:'#FDEFD6',color:'#8A500F',b:1},'Pending':{fill:'#EEEBF5',color:'#4B5565',b:1}};
const HDR={b:1,color:'#FFFFFF',fill:C.P,h:'left',v:'center',bd:['thin','#6D42E8'],sz:11};
const cell=(o)=>Object.assign({sz:11,color:C.INK,v:'center',bb:['thin',C.LINE]},o||{});
const dateFmt='dd mmm yyyy';
const D=(y,m,d)=>new Date(y,m-1,d);

function frame(sh,cols,rowsTop){ // brand bar across the top of dashboard sheets
  for(let c=1;c<=cols;c++)sh.set(1,c,null,{fill:C.P});sh.height(1,8);
}
function titleBlock(sh,title,sub,c1,c2,eyebrow){
  sh.set(3,c1,eyebrow||'VIVOQUEST REPORT',{b:1,sz:10,color:C.P});sh.merge(3,c1,3,c2);
  sh.set(4,c1,title,{b:1,sz:26,color:C.INK});sh.merge(4,c1,4,c2);sh.height(4,38);
  sh.set(5,c1,sub,{sz:11,color:C.MUT});sh.merge(5,c1,5,c2);sh.height(5,20);
}
function kpiTiles(sh,r,tiles,startCol,span){
  tiles.forEach((t,i)=>{
    const c1=startCol+i*span,c2=c1+span-1;
    const top={fill:C.BG,bt:['thick',C.P]};
    sh.set(r,c1,t.l,Object.assign({sz:10,b:1,color:C.MUT,indent:1,v:'center'},top));sh.style(r,c1,r,c2,top);sh.merge(r,c1,r,c2);
    sh.set(r+1,c1,t.v,{sz:24,b:1,color:C.INK,fill:C.BG,indent:1,h:'left',v:'center',fmt:t.fmt});sh.style(r+1,c1,r+1,c2,{fill:C.BG});sh.merge(r+1,c1,r+1,c2);
    const tone=t.tone==='ok'?[C.G]:t.tone==='warn'?[C.A]:[C.R];
    sh.set(r+2,c1,t.d,{sz:10,b:1,color:tone[0],fill:C.BG,indent:1,v:'center'});sh.style(r+2,c1,r+2,c2,{fill:C.BG});sh.merge(r+2,c1,r+2,c2);
  });
  sh.height(r,22);sh.height(r+1,38);sh.height(r+2,22);
}

function chartsSheetBase(bk,title,sub,eyebrow){
  const ch=bk.sheet('Charts',{grid:false,tab:C.ACC,fitH:1});
  for(let c=1;c<=14;c++)ch.width(c,c===1||c===14?2.5:13.6);frame(ch,14);
  titleBlock(ch,title,sub,2,13,eyebrow);return ch;
}
function dataTable(sh,r,c,head,rows,fmt){
  const th={b:1,sz:10,color:C.P,fill:C.LAV,v:'center',indent:1};
  sh.set(r,c,head[0],th);sh.set(r,c+1,head[1],Object.assign({},th,{h:'right'}));
  rows.forEach((x,i)=>{const cs={sz:10,indent:1,v:'center',bb:['thin',C.LINE]};sh.set(r+1+i,c,x[0],cs);sh.set(r+1+i,c+1,x[1],Object.assign({},cs,{h:'right',fmt}));});
}

function visualsSheet(bk,title,sub){
  const sh=bk.sheet('Visuals',{grid:false,tab:C.ACC,fitH:1});
  sh.width(1,2.5);sh.width(2,28);sh.width(3,16);sh.width(4,58);sh.width(5,10);sh.width(6,2.5);frame(sh,6);
  titleBlock(sh,title,sub,2,5,'AT A GLANCE');sh.cur=7;return sh;
}
/* cell-built bar chart: works in every viewer (no drawing layer needed) */
function barBlock(sh,title,items,fmt,shareFmt){
  let r=sh.cur;sectionHead(sh,r,2,5,title);r++;
  const a=r,z=r+items.length-1;const mx=Math.max(...items.map((x)=>x.v))||1;const tot=items.reduce((q,x)=>q+x.v,0)||1;
  items.forEach((x,i)=>{const rr=a+i;
    sh.set(rr,2,x.label,{b:1,sz:11,indent:1,v:'center',bb:['thin',C.L2||C.LINE]});
    sh.set(rr,3,x.f?{f:x.f,v:x.v}:x.v,{sz:11,h:'right',fmt,v:'center',indent:1,bb:['thin',C.L2||C.LINE]});
    const n=Math.max(1,Math.round(x.v/mx*44));
    sh.set(rr,4,{f:'REPT("█",MAX(1,ROUND(C'+rr+'/MAX($C$'+a+':$C$'+z+')*44,0)))',v:'█'.repeat(n)},{sz:12,color:x.color,v:'center',bb:['thin',C.L2||C.LINE]});
    if(shareFmt!=='none')sh.set(rr,5,{f:'C'+rr+'/SUM($C$'+a+':$C$'+z+')',v:x.v/tot},{sz:10,b:1,color:C.MUT,h:'right',fmt:shareFmt||'0%',v:'center',bb:['thin',C.L2||C.LINE]});
    sh.height(rr,24);
  });
  sh.cur=z+2;
}

const absRef=(r,c)=>'$'+colName(c)+'$'+r;
/* Cell-built charts for the Charts sheet. They sit under the native charts (Excel hides them) and show in viewers that do not draw chart objects. */
function gridChart(sh,o){
  const t=o.t,c1=o.c1,W=6,items=o.items,n=items.length;const BG=C.BG;
  sh.set(t,c1,o.title,{b:1,sz:13,color:C.INK,bb:['medium',C.P]});sh.style(t,c1,t,c1+W-1,{bb:['medium',C.P]});sh.merge(t,c1,t,c1+W-1);sh.height(t,24);
  for(let r=t+1;r<=t+18;r++){sh.style(r,c1,r,c1+W-1,{fill:BG});}
  if(o.mode==='col'){
    const k=Math.min(2,Math.floor(W/n)),start=c1+Math.floor((W-n*k)/2);const vr=t+14,lr=t+15;
    const rowRng=absRef(vr,start)+':'+absRef(vr,start+n*k-1);
    for(let r=t+2;r<=t+13;r++)sh.height(r,15);sh.height(vr,24);sh.height(lr,24);
    items.forEach((it,i)=>{const ca=start+i*k,cb=ca+k-1;
      for(let r=t+2;r<=t+13;r++){sh.style(r,ca,r,ca,{fill:BG,bl:['thick',BG]});sh.style(r,cb,r,cb,{fill:BG,br:['thick',BG],bl:ca===cb?['thick',BG]:undefined});}
      sh.set(vr,ca,{f:it.ref,v:it.v},{b:1,sz:11,color:C.INK,h:'center',fmt:o.fmt,fill:BG});sh.style(vr,ca,vr,cb,{fill:BG});sh.merge(vr,ca,vr,cb);
      sh.set(lr,ca,it.label,{sz:10,b:1,color:C.MUT,h:'center',wrap:1,fill:BG});sh.style(lr,ca,lr,cb,{fill:BG});sh.merge(lr,ca,lr,cb);
      const V=absRef(vr,ca);
      sh.cfExpr(ref(t+2,ca)+':'+ref(t+13,cb),'AND(N('+V+')>0,MAX(1,ROUND('+V+'/MAX('+rowRng+')*12,0))>=('+(t+14)+'-ROW()))',it.color);
    });
    if(o.note){sh.set(t+17,c1,o.note,{sz:10,i:1,color:C.MUT,fill:BG,indent:1});sh.merge(t+17,c1,t+17,c1+W-1);}
  }else if(o.mode==='hbar'){
    const rows=n*2;const vcol=c1+W-1;const vr1=t+2,vrN=t+1+rows;const rng=absRef(vr1,vcol)+':'+absRef(vrN,vcol);const mx=Math.max(...items.map((q)=>q.v))||1;
    for(let r=t+2;r<=t+15;r++)sh.height(r,15);
    items.forEach((it,i)=>{const r=t+2+i*2;
      sh.set(r,c1,it.label,{b:1,sz:11,color:C.INK,fill:BG,indent:1,v:'center'});sh.style(r,c1,r+1,c1+1,{fill:BG});sh.merge(r,c1,r+1,c1+1);
      sh.set(r,vcol,{f:it.ref,v:it.v},{b:1,sz:11,color:C.INK,h:'right',fmt:o.fmt,fill:BG,v:'center'});sh.style(r,vcol,r+1,vcol,{fill:BG});sh.merge(r,vcol,r+1,vcol);
      sh.set(r,c1+2,{f:'REPT("█",MAX(1,ROUND('+ref(r,vcol)+'/MAX('+rng+')*30,0)))',v:'█'.repeat(Math.max(1,Math.round(it.v/mx*30)))},{sz:14,color:it.color,fill:BG,v:'center'});sh.style(r,c1+2,r+1,c1+4,{fill:BG});sh.merge(r,c1+2,r+1,c1+4);
    });
  }else{ /* tiles: share cards in place of a pie or doughnut */
    const per=n<=4?2:3,w=W/per;const tot=items.reduce((a,q)=>a+q.v,0)||1;
    items.forEach((it,i)=>{const br=Math.floor(i/per),bc=(i%per)*w;const r=t+2+br*8,c=c1+bc;
      for(let q=r;q<r+7;q++)sh.height(q,q<r+4?17:15);
      const fill={fill:it.color,bl:['thick',BG],br:['thick',BG],bt:['thick',BG],bb:['thick',BG]};
      sh.set(r,c,{f:'TEXT('+it.ref+'/SUM('+o.sum+'),"0%")',v:Math.round(it.v/tot*100)+'%'},Object.assign({b:1,sz:24,color:'#FFFFFF',h:'center',v:'center'},fill));sh.style(r,c,r+3,c+w-1,fill);sh.merge(r,c,r+3,c+w-1);
      sh.set(r+4,c,{f:'"'+it.label+'  "&TEXT('+it.ref+',"'+o.fmt.replace(/"/g,'""')+'")',v:it.label+'  '+it.vtxt},Object.assign({b:1,sz:10,color:'#FFFFFF',h:'center',v:'center',wrap:1},fill));sh.style(r+4,c,r+6,c+w-1,fill);sh.merge(r+4,c,r+6,c+w-1);
    });
  }
}
function sectionHead(sh,r,c1,c2,text){sh.set(r,c1,text,{b:1,sz:13,color:C.INK,bb:['medium',C.P]});sh.style(r,c1,r,c2,{bb:['medium',C.P]});sh.merge(r,c1,r,c2);sh.height(r,24);}
function aboutSheet(book,title,rows,tab){
  const s=book.sheet('About',{grid:false,tab,landscape:false,fitH:1});frame(s,6);s.width(1,2.5);s.width(2,24);s.width(3,86);
  titleBlock(s,title,'How to read this workbook',2,3,'ABOUT THIS WORKBOOK');
  rows.forEach((r,i)=>{const rr=7+i;s.set(rr,2,r[0],{b:1,color:C.P,sz:11,v:'top',bb:['thin',C.LINE]});s.set(rr,3,r[1],{sz:11,wrap:1,v:'top',bb:['thin',C.LINE]});s.height(rr,34);});
  return s;
}

/* ===== Payments reconciliation ===== */
function paymentsWorkbook(d){
  const tx=d.tx,rf=d.rf;const n=tx.length;const last=n+1;
  const bk=new Book({title:'Payments reconciliation',subject:d.period,author:d.by||'VivoQuest',keywords:'payments, reconciliation, Razorpay, Stripe',company:'VivoQuest'});
  const sum=bk.sheet('Summary',{grid:false,tab:C.P,fitH:1});
  const ch=chartsSheetBase(bk,'Payments analytics','Razorpay and Stripe · '+d.period+' · Interactive: choose a gateway and every figure updates','ANALYTICS');
  const t=bk.sheet('Transactions',{tab:'#18845B',freeze:{r:1,c:2},printTitles:1});
  const r=bk.sheet('Refunds',{tab:'#A96513',freeze:{r:1,c:0},printTitles:1});
  const ab=aboutSheet(bk,'Payments reconciliation',[['Summary','Headline numbers for the period. Every figure is a live formula over the Transactions and Refunds sheets.'],['Transactions','One row per payment attempt from Razorpay and Stripe. Filter by status, gateway or method.'],['Refunds','Every refund raised in the period and where it stands.'],['Colour legend','Green is captured or processed, amber needs a look, red failed, grey pending.'],['Source','Gateway webhooks stored by VivoQuest and matched to orders. Generated '+(d.generated||new Date()).toLocaleString('en-IN')+' by '+(d.by||'[User]')+'.']],'#667085');
  /* Transactions */
  const cols=[['Date',13],['Order',12],['Gateway',12],['Method',14],['Payment ID',18],['Currency',10],['Amount',14],['Amount (INR)',16],['Status',13],['Settled on',14]];
  cols.forEach((c,i)=>{t.width(i+1,c[1]);t.set(1,i+1,c[0],Object.assign({},HDR,{h:i===6||i===7?'right':'left',indent:1}));});t.height(1,26);
  tx.forEach((x,i)=>{const rr=i+2;const alt=i%2?{fill:C.ALT}:{};
    t.set(rr,1,x.date,cell(Object.assign({fmt:dateFmt,h:'left',indent:1},alt)));
    t.set(rr,2,x.order,cell(Object.assign({indent:1,b:1},alt)));t.set(rr,3,x.gw,cell(Object.assign({indent:1},alt)));t.set(rr,4,x.method,cell(Object.assign({indent:1},alt)));t.set(rr,5,x.payId,cell(Object.assign({indent:1,color:C.MUT},alt)));t.set(rr,6,x.cur,cell(Object.assign({h:'center'},alt)));
    t.set(rr,7,x.amt,cell(Object.assign({h:'right',fmt:x.cur==='USD'?'"$"#,##0.00':'"₹"#,##0.00',indent:1},alt)));
    t.set(rr,8,x.inr,cell(Object.assign({h:'right',fmt:'"₹"#,##0.00',indent:1},alt)));
    t.set(rr,9,x.status,cell(Object.assign({h:'center',b:1},alt)));
    t.set(rr,10,x.settled||'–',cell(Object.assign({fmt:dateFmt,h:x.settled?'left':'center',indent:1,color:x.settled?C.INK:C.MUT},alt)));t.height(rr,21);});
  const tr=n+2;const capSum=tx.filter((x)=>x.status==='Captured').reduce((a,x)=>a+x.inr,0);const capN=tx.filter((x)=>x.status==='Captured').length;
  const tot={b:1,fill:C.LAV,color:C.INK,bt:['medium',C.P],bb:['thin',C.LINE],v:'center'};
  t.set(tr,1,'Captured total',Object.assign({indent:1},tot));t.style(tr,2,tr,7,tot);
  t.set(tr,8,{f:'SUMIFS(H2:H'+last+',I2:I'+last+',"Captured")',v:capSum},Object.assign({h:'right',fmt:'"₹"#,##0.00',indent:1},tot));
  t.set(tr,9,{f:'COUNTIF(I2:I'+last+',"Captured")',v:capN},Object.assign({h:'center',fmt:'0 "captured"'},tot));t.set(tr,10,null,tot);t.height(tr,24);
  t.af='A1:J'+last;t.cfStatus('I2:I'+last,STATUS_DXF);t.cfBar('H2:H'+last,'#C9B8FA');
  /* Refunds */
  const rc=[['Refund date',14],['Order',12],['Gateway',12],['Refund ID',18],['Amount (INR)',16],['Reason',24],['Status',13],['Expected by',14]];
  rc.forEach((c,i)=>{r.width(i+1,c[1]);r.set(1,i+1,c[0],Object.assign({},HDR,{h:i===4?'right':'left',indent:1}));});r.height(1,26);
  rf.forEach((x,i)=>{const rr=i+2;const alt=i%2?{fill:C.ALT}:{};r.set(rr,1,x.date,cell(Object.assign({fmt:dateFmt,indent:1,h:'left'},alt)));r.set(rr,2,x.order,cell(Object.assign({indent:1,b:1},alt)));r.set(rr,3,x.gw,cell(Object.assign({indent:1},alt)));r.set(rr,4,x.id,cell(Object.assign({indent:1,color:C.MUT},alt)));r.set(rr,5,x.amt,cell(Object.assign({h:'right',fmt:'"₹"#,##0.00',indent:1},alt)));r.set(rr,6,x.reason,cell(Object.assign({indent:1},alt)));r.set(rr,7,x.status,cell(Object.assign({h:'center',b:1},alt)));r.set(rr,8,x.expected,cell(Object.assign({fmt:dateFmt,indent:1,h:'left'},alt)));r.height(rr,21);});
  const rl=rf.length+1;const rt=rf.length+2;const refSum=rf.reduce((a,x)=>a+x.amt,0);
  r.set(rt,1,'Total refunded',Object.assign({indent:1},tot));r.style(rt,2,rt,4,tot);r.set(rt,5,{f:'SUM(E2:E'+rl+')',v:refSum},Object.assign({h:'right',fmt:'"₹"#,##0.00',indent:1},tot));r.style(rt,6,rt,8,tot);r.height(rt,24);
  r.af='A1:H'+rl;r.cfStatus('G2:G'+rl,STATUS_DXF);
  /* Summary */
  const paid=tx.filter((x)=>x.status==='Captured'||x.status==='Refunded');const failed=tx.filter((x)=>x.status==='Failed');
  const gross=paid.reduce((a,x)=>a+x.inr,0);const rate=paid.length/(paid.length+failed.length);
  for(let c=1;c<=14;c++)sum.width(c,c===1||c===14?2.5:13.6);frame(sum,14);
  titleBlock(sum,'Payments reconciliation','Razorpay and Stripe · '+d.period+' · All amounts converted to INR',2,13);
  const S='Transactions!$I$2:$I$'+last,H='Transactions!$H$2:$H$'+last,G='Transactions!$C$2:$C$'+last,M='Transactions!$D$2:$D$'+last;
  const paidF=(rng)=>'SUMIFS('+H+','+S+',"Captured"'+(rng?','+rng:'')+')+SUMIFS('+H+','+S+',"Refunded"'+(rng?','+rng:'')+')';
  const cntF=(rng)=>'COUNTIFS('+S+',"Captured"'+(rng?','+rng:'')+')+COUNTIFS('+S+',"Refunded"'+(rng?','+rng:'')+')';
  kpiTiles(sum,7,[
   {l:'GROSS COLLECTED',v:{f:paidF(''),v:gross},fmt:'"₹"#,##0',d:paid.length+' payments',tone:'ok'},
   {l:'REFUNDS',v:{f:'SUM(Refunds!$E$2:$E$'+rl+')',v:refSum},fmt:'"₹"#,##0',d:rf.length+(rf.length===1?' refund':' refunds'),tone:'warn'},
   {l:'NET REVENUE',v:{f:'E8-H8',v:gross-refSum},fmt:'"₹"#,##0',d:'After refunds',tone:'ok'},
   {l:'SUCCESS RATE',v:{f:'('+cntF('')+')/(('+cntF('')+')+COUNTIF('+S+',"Failed"))',v:rate},fmt:'0.0%',d:failed.length+' failed',tone:rate<0.9?'warn':'ok'}],2,3);
  /* fix net formula references: tiles start col B(2),E(5),H(8),K(11); value row 8 */
  sum.set(8,5,{f:'B8-E8',v:gross-refSum},{sz:24,b:1,color:C.INK,fill:C.BG,indent:1,h:'left',v:'center',fmt:'"₹"#,##0'});
  sum.set(8,8,{f:'(' +cntF('')+')/(('+cntF('')+')+COUNTIF('+S+',"Failed"))',v:rate},{sz:24,b:1,color:C.INK,fill:C.BG,indent:1,h:'left',v:'center',fmt:'0.0%'});
  /* the tile order above puts Net in 3rd position (col H) and success rate in 4th (col K); rewrite explicitly */
  sum.set(8,2,{f:paidF(''),v:gross},{sz:24,b:1,color:C.INK,fill:C.BG,indent:1,h:'left',v:'center',fmt:'"₹"#,##0'});
  sum.set(8,5,{f:'SUM(Refunds!$E$2:$E$'+rl+')',v:refSum},{sz:24,b:1,color:C.INK,fill:C.BG,indent:1,h:'left',v:'center',fmt:'"₹"#,##0'});
  sum.set(8,8,{f:'B8-E8',v:gross-refSum},{sz:24,b:1,color:C.INK,fill:C.BG,indent:1,h:'left',v:'center',fmt:'"₹"#,##0'});
  sum.set(8,11,{f:'('+cntF('')+')/(('+cntF('')+')+COUNTIF('+S+',"Failed"))',v:rate},{sz:24,b:1,color:C.INK,fill:C.BG,indent:1,h:'left',v:'center',fmt:'0.0%'});
  /* gateway table */
  sectionHead(sum,12,2,7,'By gateway');sectionHead(sum,12,9,13,'By payment method');
  const th={b:1,sz:10,color:C.P,fill:C.LAV,v:'center',indent:1};
  [[2,3,'GATEWAY'],[4,4,'PAYMENTS'],[5,6,'AMOUNT (INR)'],[7,7,'SHARE']].forEach(([a,b,tx2])=>{sum.set(13,a,tx2,Object.assign({},th,{h:a>=4?'right':'left'}));sum.style(13,a,13,b,th);if(b>a)sum.merge(13,a,13,b);});
  const gws=['Razorpay','Stripe'];
  gws.forEach((g,i)=>{const rr=14+i;const gp=paid.filter((x)=>x.gw===g);const rng=G+',"'+g+'"';const amt=gp.reduce((a,x)=>a+x.inr,0);const cs=cell({});
    sum.set(rr,2,g,Object.assign({},cs,{b:1,indent:1}));sum.style(rr,2,rr,3,cs);sum.merge(rr,2,rr,3);
    sum.set(rr,4,{f:cntF(rng),v:gp.length},Object.assign({},cs,{h:'right',indent:1}));
    sum.set(rr,5,{f:paidF(rng),v:amt},Object.assign({},cs,{h:'right',fmt:'"₹"#,##0',indent:1}));sum.style(rr,5,rr,6,cs);sum.merge(rr,5,rr,6);
    sum.set(rr,7,{f:'IFERROR(E'+rr+'/$B$8,0)',v:amt/gross},Object.assign({},cs,{h:'right',fmt:'0%',indent:1}));sum.height(rr,22);});
  sum.set(16,2,'Total',{b:1,bt:['thin',C.P],indent:1});sum.style(16,2,16,3,{bt:['thin',C.P]});sum.merge(16,2,16,3);
  sum.set(16,4,{f:'SUM(D14:D15)',v:paid.length},{b:1,bt:['thin',C.P],h:'right',indent:1});sum.set(16,5,{f:'SUM(E14:E15)',v:gross},{b:1,bt:['thin',C.P],h:'right',fmt:'"₹"#,##0',indent:1});sum.style(16,5,16,6,{bt:['thin',C.P]});sum.merge(16,5,16,6);sum.set(16,7,{f:'SUM(G14:G15)',v:1},{b:1,bt:['thin',C.P],h:'right',fmt:'0%',indent:1});sum.height(16,22);
  /* method table */
  const methods=[...new Set(paid.map((x)=>x.method))];
  [[9,10,'METHOD'],[11,11,'PAYMENTS'],[12,13,'SHARE']].forEach(([a,b,tx2])=>{sum.set(13,a,tx2,Object.assign({},th,{h:a>=11?'right':'left'}));sum.style(13,a,13,b,th);if(b>a)sum.merge(13,a,13,b);});
  methods.forEach((m,i)=>{const rr=14+i;const cn=paid.filter((x)=>x.method===m).length;const cs=cell({});
    sum.set(rr,9,m,Object.assign({},cs,{b:1,indent:1}));sum.style(rr,9,rr,10,cs);sum.merge(rr,9,rr,10);
    sum.set(rr,11,{f:cntF(M+',"'+m+'"'),v:cn},Object.assign({},cs,{h:'right',indent:1}));
    sum.set(rr,12,{f:'IFERROR(K'+rr+'/SUM($K$14:$K$'+(13+methods.length)+'),0)',v:cn/paid.length},Object.assign({},cs,{h:'right',fmt:'0%',indent:1}));sum.style(rr,12,rr,13,cs);sum.merge(rr,12,rr,13);sum.height(rr,22);});
  sum.cfBar('L14:L'+(13+methods.length),'#C9B8FA');
  /* chart */
  sum.chart({at:{c1:2,r1:21,c2:8,r2:39},title:'Collected by gateway (INR)',catRef:"Summary!$B$14:$B$15",cats:gws,lblFmt:'"₹"#,##0',axFmt:'"₹"#,##0',series:[{name:'Amount (INR)',nameRef:'Summary!$E$13',ref:'Summary!$E$14:$E$15',vals:gws.map((g)=>paid.filter((x)=>x.gw===g).reduce((a,x)=>a+x.inr,0)),color:'4520B8',ptColors:['4520B8','6D42E8']}],gap:90});

  /* Charts sheet: interactive analytics dashboard */
  {
    const DT=64,CR='$C$'+(DT-2),SEL='$D$7';const PUR=['4520B8','6D42E8','9B7CF0','2E1478','7A58E0'];
    const R0=DT+1;const rr=(c,n)=>'$'+c+'$'+R0+':$'+c+'$'+(DT+n);
    ch.set(7,2,'VIEW',{b:1,sz:10,color:C.P,fill:C.LAV,h:'center',v:'center'});
    ch.set(7,3,'Gateway',{b:1,sz:11,color:C.INK,fill:C.LAV,h:'center',v:'center'});
    ch.set(7,4,'All',{b:1,sz:12,color:'#FFFFFF',fill:C.P,h:'center',v:'center'});ch.style(7,4,7,5,{fill:C.P});ch.merge(7,4,7,5);
    ch.set(7,6,'◀ Choose All, Razorpay or Stripe in the purple cell. The tiles, charts and takeaways below update.',{sz:10,i:1,color:C.MUT,v:'center',indent:1});ch.merge(7,6,7,13);ch.height(7,32);ch.dv('D7',['All','Razorpay','Stripe']);
    const cnt0=paid.length,fail0=failed.length,ref0=tx.filter((x)=>x.status==='Refunded').length;
    kpiTiles(ch,9,[
     {l:'COLLECTED',v:{f:paidF(G+','+CR),v:gross},fmt:'"₹"#,##0',d:'Captured and refunded',tone:'ok'},
     {l:'PAYMENTS',v:{f:cntF(G+','+CR),v:cnt0},fmt:'0',d:'Settled payments',tone:'ok'},
     {l:'AVERAGE PAYMENT',v:{f:'IFERROR(B10/E10,0)',v:gross/cnt0},fmt:'"₹"#,##0',d:'Per settled payment',tone:'ok'},
     {l:'SUCCESS RATE',v:{f:'IFERROR(E10/(E10+COUNTIFS('+S+',"Failed",'+G+','+CR+')),0)',v:rate},fmt:'0.0%',d:'Successful ÷ attempted',tone:rate<0.9?'warn':'ok'}],2,3);
    const gwRows=gws.map((g)=>[g,{f:'IF(OR('+SEL+'="All",'+SEL+'="'+g+'"),'+paidF(G+',"'+g+'"')+',0)',v:paid.filter((x)=>x.gw===g).reduce((a,x)=>a+x.inr,0)}]);
    const mCnt=methods.map((m)=>[m,{f:cntF(M+',"'+m+'",'+G+','+CR),v:paid.filter((x)=>x.method===m).length}]);
    const mAmt=methods.map((m)=>[m,{f:paidF(M+',"'+m+'",'+G+','+CR),v:paid.filter((x)=>x.method===m).reduce((a,x)=>a+x.inr,0)}]);
    const stOrder=[['Captured',THEME.green],['Refunded',THEME.amber],['Failed',THEME.red],['Pending',THEME.grey]].filter((x)=>tx.some((y)=>y.status===x[0]));
    const stRows=stOrder.map((x)=>[x[0],{f:'COUNTIFS('+S+',"'+x[0]+'",'+G+','+CR+')',v:tx.filter((y)=>y.status===x[0]).length}]);
    sectionHead(ch,DT-4,2,13,'Chart data (live formulas over Transactions)');
    ch.set(DT-2,2,'Gateway filter',{sz:10,b:1,color:C.MUT,indent:1});ch.set(DT-2,3,{f:'IF('+SEL+'="All","*",'+SEL+')',v:'*'},{sz:10,color:C.MUT,h:'right'});
    dataTable(ch,DT,2,['GATEWAY','INR'],gwRows,'"₹"#,##0');dataTable(ch,DT,5,['METHOD','PAYMENTS'],mCnt,'0');dataTable(ch,DT,8,['STATUS','PAYMENTS'],stRows,'0');dataTable(ch,DT,11,['METHOD','INR'],mAmt,'"₹"#,##0');
    ch.cfBar('C'+R0+':C'+(DT+gws.length),'#9B7CF0');ch.cfBar('F'+R0+':F'+(DT+methods.length),'#9B7CF0');ch.cfBar('I'+R0+':I'+(DT+stRows.length),'#9B7CF0');ch.cfBar('L'+R0+':L'+(DT+methods.length),'#9B7CF0');
    gridChart(ch,{t:13,c1:2,mode:'col',title:'Collected by gateway (INR)',fmt:'"₹"#,##0',items:gwRows.map((x,i)=>({label:x[0],ref:'C'+(R0+i),v:x[1].v,color:PUR[i%2]}))});
    gridChart(ch,{t:13,c1:8,mode:'tiles',title:'Payment methods, share of payments',fmt:'0',sum:'F'+R0+':F'+(DT+methods.length),items:mCnt.map((x,i)=>({label:x[0],ref:'F'+(R0+i),v:x[1].v,vtxt:String(x[1].v),color:PUR[i%PUR.length]}))});
    gridChart(ch,{t:33,c1:2,mode:'tiles',title:'Payments by status',fmt:'0',sum:'I'+R0+':I'+(DT+stRows.length),items:stRows.map((x,i)=>({label:x[0],ref:'I'+(R0+i),v:x[1].v,vtxt:String(x[1].v),color:stOrder[i][1]}))});
    gridChart(ch,{t:33,c1:8,mode:'hbar',title:'Collected by method (INR)',fmt:'"₹"#,##0',items:mAmt.map((x,i)=>({label:x[0],ref:'L'+(R0+i),v:x[1].v,color:PUR[i%PUR.length]}))});
    const ccat=(c,n)=>'Charts!$'+c+'$'+R0+':$'+c+'$'+(DT+n);
    ch.chart({at:{c1:2,r1:13,c2:8,r2:32},title:'Collected by gateway (INR)',catRef:ccat('B',gws.length),cats:gws,lblFmt:'"₹"#,##0',axFmt:'"₹"#,##0',gap:90,series:[{name:'INR',nameRef:'Charts!$C$'+DT,ref:ccat('C',gws.length),vals:gwRows.map((x)=>x[1].v),color:'4520B8',ptColors:['4520B8','6D42E8']}]});
    ch.chart({at:{c1:8,r1:13,c2:14,r2:32},title:'Payment methods, share of payments',type:'doughnut',catRef:ccat('E',methods.length),cats:methods,lblFmt:'0%',series:[{name:'Payments',nameRef:'Charts!$F$'+DT,ref:ccat('F',methods.length),vals:mCnt.map((x)=>x[1].v)}]});
    ch.chart({at:{c1:2,r1:33,c2:8,r2:52},title:'Payments by status',type:'pie',catRef:ccat('H',stRows.length),cats:stOrder.map((x)=>x[0]),lblFmt:'0%',series:[{name:'Payments',nameRef:'Charts!$I$'+DT,ref:ccat('I',stRows.length),vals:stRows.map((x)=>x[1].v),ptColors:stOrder.map((x)=>x[1])}]});
    ch.chart({at:{c1:8,r1:33,c2:14,r2:52},title:'Collected by method (INR)',type:'hbar',catRef:ccat('K',methods.length),cats:methods,lblFmt:'"₹"#,##0',gap:50,series:[{name:'INR',nameRef:'Charts!$L$'+DT,ref:ccat('L',methods.length),vals:mAmt.map((x)=>x[1].v),color:'6D42E8'}]});
    /* takeaways */
    sectionHead(ch,54,2,13,'Key takeaways');
    const amtV=mAmt.map((x)=>x[1].v),gwV=gwRows.map((x)=>x[1].v);const topM=methods[amtV.indexOf(Math.max(...amtV))],topG=gws[gwV.indexOf(Math.max(...gwV))];
    const cards=[
     ['TOP PAYMENT METHOD',{f:'IFERROR(INDEX('+rr('K',methods.length)+',MATCH(MAX('+rr('L',methods.length)+'),'+rr('L',methods.length)+',0))&" brings "&TEXT(MAX('+rr('L',methods.length)+')/SUM('+rr('L',methods.length)+'),"0%")&" of collected value","No payments in this view")',v:topM+' brings '+Math.round(Math.max(...amtV)/amtV.reduce((a,b)=>a+b,0)*100)+'% of collected value'}],
     ['LEADING GATEWAY',{f:'IFERROR(INDEX('+rr('B',gws.length)+',MATCH(MAX('+rr('C',gws.length)+'),'+rr('C',gws.length)+',0))&" collects "&TEXT(MAX('+rr('C',gws.length)+')/SUM('+rr('C',gws.length)+'),"0%")&" of the value","No payments in this view")',v:topG+' collects '+Math.round(Math.max(...gwV)/gwV.reduce((a,b)=>a+b,0)*100)+'% of the value'}],
     ['NEEDS ATTENTION',{f:'COUNTIFS('+S+',"Failed",'+G+','+CR+')&" failed and "&COUNTIFS('+S+',"Refunded",'+G+','+CR+')&" refunded payments in this view"',v:fail0+' failed and '+ref0+' refunded payments in this view'}]];
    cards.forEach((cd,i)=>{const c=2+i*4;const acc={bl:['thick',C.P],fill:C.BG};
      ch.set(56,c,cd[0],Object.assign({b:1,sz:9,color:C.P,indent:1,v:'center'},acc));ch.style(56,c,56,c+3,{fill:C.BG});ch.style(56,c,56,c,acc);ch.merge(56,c,56,c+3);
      ch.set(57,c,cd[1],Object.assign({b:1,sz:12,color:C.INK,wrap:1,indent:1,v:'top'},acc));ch.style(57,c,59,c+3,{fill:C.BG});for(let q=57;q<=59;q++)ch.style(q,c,q,c,acc);ch.merge(57,c,59,c+3);
    });ch.height(56,22);[57,58,59].forEach((q)=>ch.height(q,20));
  }
  /* notes card */
  sectionHead(sum,21,10,13,'Reading this report');
  ['Green is captured, amber is refunded, red failed, grey pending.','Amounts in USD are converted to INR at the settlement rate.','Gross counts captured and refunded payments. Net removes refunds.','Open Transactions to filter by status, gateway or method.'].forEach((tx3,i)=>{sum.set(22+i*2,10,tx3,{sz:11,color:C.INK,wrap:1,v:'top',indent:1});sum.merge(22+i*2,10,23+i*2,13);});
  sum.set(41,2,'Sample values illustrate the layout. Generated '+(d.generated||new Date()).toLocaleString('en-IN')+'.',{sz:9,color:C.MUT,i:1});sum.merge(41,2,41,13);
  bk.sheets=[sum,ch,t,r,ab];
  return bk.build();
}

/* ===== Outcomes report ===== */
function outcomesWorkbook(d){
  const F=d.fac,Mo=d.mon;const TG=d.target;const nF=F.length;const lf=nF+1;const nM=Mo.length;const lm=nM+1;
  const bk=new Book({title:'Outcomes report',subject:d.period,author:d.by||'VivoQuest',keywords:'outcomes, readmission, adherence, ACO',company:'VivoQuest'});
  const sum=bk.sheet('Summary',{grid:false,tab:C.P,fitH:1});
  const ch=chartsSheetBase(bk,'Outcomes analytics','Health plan and ACO · '+d.period+' · Interactive: choose a metric and the facility comparison updates','ANALYTICS');
  const fm=bk.sheet('Facility metrics',{tab:'#18845B',freeze:{r:1,c:1},printTitles:1});
  const mt=bk.sheet('Monthly trend',{tab:C.ACC,freeze:{r:1,c:1},printTitles:1});
  const ab=aboutSheet(bk,'Outcomes report',[['Summary','Headline results for the period, the readmission trend and the facilities that need a review.'],['Facility metrics','One row per facility. Variance is readmission rate minus target in points, so negative is better.'],['Monthly trend','Six months of readmissions against the target, with remote check-in completion.'],['Status rule','On target at or below target. Watch up to 10% above target. Needs action beyond that.'],['Source','VivoQuest care records and remote monitoring. Generated '+(d.generated||new Date()).toLocaleString('en-IN')+' for '+(d.plan||'[Plan or ACO name]')+'.']],'#667085');
  const stat=(v)=>v<=TG?'On target':(v<=TG*1.1?'Watch':'Needs action');
  /* Facility metrics */
  const fc=[['Facility',20],['Patients',11],['Readmit %',12],['Target %',11],['Variance (pts)',15],['Adherence %',15],['Check-ins done',15],['Satisfaction',13],['Status',16]];
  fc.forEach((c,i)=>{fm.width(i+1,c[1]);fm.set(1,i+1,c[0],Object.assign({},HDR,{h:i===0||i===8?'left':'right',indent:1}));});fm.height(1,26);
  F.forEach((x,i)=>{const rr=i+2;const alt=i%2?{fill:C.ALT}:{};
    fm.set(rr,1,x.name,cell(Object.assign({b:1,indent:1},alt)));fm.set(rr,2,x.n,cell(Object.assign({h:'right',fmt:'#,##0',indent:1},alt)));
    fm.set(rr,3,x.readmit/100,cell(Object.assign({h:'right',fmt:'0.0%',indent:1},alt)));fm.set(rr,4,TG/100,cell(Object.assign({h:'right',fmt:'0.0%',indent:1},alt)));
    fm.set(rr,5,{f:'(C'+rr+'-D'+rr+')*100',v:x.readmit-TG},cell(Object.assign({h:'right',fmt:'+0.0;"−"0.0;0.0',indent:1},alt)));
    fm.set(rr,6,x.adh/100,cell(Object.assign({h:'right',fmt:'0%',indent:1},alt)));fm.set(rr,7,x.chk/100,cell(Object.assign({h:'right',fmt:'0%',indent:1},alt)));fm.set(rr,8,x.csat,cell(Object.assign({h:'right',fmt:'0.0',indent:1},alt)));
    fm.set(rr,9,{f:'IF(C'+rr+'<=D'+rr+',"On target",IF(C'+rr+'<=D'+rr+'*1.1,"Watch","Needs action"))',v:stat(x.readmit)},cell(Object.assign({h:'center',b:1},alt)));fm.height(rr,21);});
  const N=F.reduce((a,x)=>a+x.n,0);const w=(k)=>F.reduce((a,x)=>a+x.n*x[k],0)/N;const tr=nF+2;
  const tot={b:1,fill:C.LAV,color:C.INK,bt:['medium',C.P],bb:['thin',C.LINE],v:'center'};
  fm.set(tr,1,'All facilities',Object.assign({indent:1},tot));
  fm.set(tr,2,{f:'SUM(B2:B'+lf+')',v:N},Object.assign({h:'right',fmt:'#,##0',indent:1},tot));
  fm.set(tr,3,{f:'SUMPRODUCT(B2:B'+lf+',C2:C'+lf+')/B'+tr,v:w('readmit')/100},Object.assign({h:'right',fmt:'0.0%',indent:1},tot));
  fm.set(tr,4,TG/100,Object.assign({h:'right',fmt:'0.0%',indent:1},tot));
  fm.set(tr,5,{f:'(C'+tr+'-D'+tr+')*100',v:w('readmit')-TG},Object.assign({h:'right',fmt:'+0.0;"−"0.0;0.0',indent:1},tot));
  fm.set(tr,6,{f:'SUMPRODUCT(B2:B'+lf+',F2:F'+lf+')/B'+tr,v:w('adh')/100},Object.assign({h:'right',fmt:'0%',indent:1},tot));
  fm.set(tr,7,{f:'SUMPRODUCT(B2:B'+lf+',G2:G'+lf+')/B'+tr,v:w('chk')/100},Object.assign({h:'right',fmt:'0%',indent:1},tot));
  fm.set(tr,8,{f:'SUMPRODUCT(B2:B'+lf+',H2:H'+lf+')/B'+tr,v:w('csat')},Object.assign({h:'right',fmt:'0.0',indent:1},tot));
  fm.set(tr,9,{f:'IF(C'+tr+'<=D'+tr+',"On target","Watch")',v:stat(w('readmit'))},Object.assign({h:'center'},tot));fm.height(tr,24);
  fm.af='A1:I'+lf;fm.cfStatus('I2:I'+lf,STATUS_DXF);fm.cfBar('F2:F'+lf,'#C9B8FA');
  /* Monthly */
  const mc=[['Month',16],['Readmit %',12],['Target %',11],['Variance (pts)',15],['Check-ins done',16],['Status',16]];
  mc.forEach((c,i)=>{mt.width(i+1,c[1]);mt.set(1,i+1,c[0],Object.assign({},HDR,{h:i===0||i===5?'left':'right',indent:1}));});mt.height(1,26);
  Mo.forEach((x,i)=>{const rr=i+2;const alt=i%2?{fill:C.ALT}:{};
    mt.set(rr,1,x.m,cell(Object.assign({b:1,indent:1},alt)));mt.set(rr,2,x.readmit/100,cell(Object.assign({h:'right',fmt:'0.0%',indent:1},alt)));mt.set(rr,3,TG/100,cell(Object.assign({h:'right',fmt:'0.0%',indent:1},alt)));
    mt.set(rr,4,{f:'(B'+rr+'-C'+rr+')*100',v:x.readmit-TG},cell(Object.assign({h:'right',fmt:'+0.0;"−"0.0;0.0',indent:1},alt)));mt.set(rr,5,x.chk/100,cell(Object.assign({h:'right',fmt:'0%',indent:1},alt)));
    mt.set(rr,6,{f:'IF(B'+rr+'<=C'+rr+',"On target",IF(B'+rr+'<=C'+rr+'*1.1,"Watch","Needs action"))',v:stat(x.readmit)},cell(Object.assign({h:'center',b:1},alt)));mt.height(rr,21);});
  const mr=nM+2;const avg=Mo.reduce((a,x)=>a+x.readmit,0)/nM;
  mt.set(mr,1,'Average',Object.assign({indent:1},tot));mt.set(mr,2,{f:'AVERAGE(B2:B'+lm+')',v:avg/100},Object.assign({h:'right',fmt:'0.0%',indent:1},tot));mt.set(mr,3,TG/100,Object.assign({h:'right',fmt:'0.0%',indent:1},tot));
  mt.set(mr,4,{f:'(B'+mr+'-C'+mr+')*100',v:avg-TG},Object.assign({h:'right',fmt:'+0.0;"−"0.0;0.0',indent:1},tot));mt.set(mr,5,{f:'AVERAGE(E2:E'+lm+')',v:Mo.reduce((a,x)=>a+x.chk,0)/nM/100},Object.assign({h:'right',fmt:'0%',indent:1},tot));mt.set(mr,6,null,tot);mt.height(mr,24);
  mt.af='A1:F'+lm;mt.cfStatus('F2:F'+lm,STATUS_DXF);mt.cfBar('E2:E'+lm,'#C9B8FA');
  /* Summary */
  for(let c=1;c<=14;c++)sum.width(c,c===1||c===14?2.5:13.6);frame(sum,14);
  titleBlock(sum,'Outcomes report',(d.plan||'[Plan or ACO name]')+' · '+d.period+' · Sample values show the layout',2,13);
  const FM="'Facility metrics'!";const ro=w('readmit'),ad=w('adh'),ck=w('chk'),cs2=w('csat');
  kpiTiles(sum,7,[{l:'30-DAY READMISSION RATE',v:{f:FM+'C'+tr,v:ro/100},fmt:'0.0%',d:(ro-TG<=0?'▼ ':'▲ ')+Math.abs(ro-TG).toFixed(1)+' pts vs target',tone:ro<=TG?'ok':'warn'},
    {l:'PLAN ADHERENCE',v:{f:FM+'F'+tr,v:ad/100},fmt:'0%',d:N.toLocaleString('en-IN')+' patients',tone:'ok'},
    {l:'REMOTE CHECK-INS DONE',v:{f:FM+'G'+tr,v:ck/100},fmt:'0%',d:'Last month '+Mo[nM-1].chk+'%',tone:'warn'},
    {l:'PATIENT SATISFACTION',v:{f:FM+'H'+tr,v:cs2},fmt:'0.0" / 5"',d:'Across all facilities',tone:'ok'}],2,3);
  sectionHead(sum,12,2,7,'Facility performance');sectionHead(sum,12,9,13,'Facilities to review');
  const th={b:1,sz:10,color:C.P,fill:C.LAV,v:'center',indent:1};
  [[2,3,'FACILITY'],[4,4,'READMIT %'],[5,5,'ADHERENCE'],[6,7,'STATUS']].forEach(([a,b,t2])=>{sum.set(13,a,t2,Object.assign({},th,{h:a===4||a===5?'right':'left'}));sum.style(13,a,13,b,th);if(b>a)sum.merge(13,a,13,b);});
  F.forEach((x,i)=>{const rr=14+i,src=i+2;const cs=cell({});
    sum.set(rr,2,{f:FM+'A'+src,v:x.name},Object.assign({},cs,{b:1,indent:1}));sum.style(rr,2,rr,3,cs);sum.merge(rr,2,rr,3);
    sum.set(rr,4,{f:FM+'C'+src,v:x.readmit/100},Object.assign({},cs,{h:'right',fmt:'0.0%',indent:1}));sum.set(rr,5,{f:FM+'F'+src,v:x.adh/100},Object.assign({},cs,{h:'right',fmt:'0%',indent:1}));
    sum.set(rr,6,{f:FM+'I'+src,v:stat(x.readmit)},Object.assign({},cs,{h:'center',b:1}));sum.style(rr,6,rr,7,cs);sum.merge(rr,6,rr,7);sum.height(rr,22);});
  sum.cfStatus('F14:F'+(13+nF),STATUS_DXF);sum.cfBar('E14:E'+(13+nF),'#C9B8FA');
  const rev=F.filter((x)=>x.readmit>TG*0.95).sort((a,b)=>b.readmit-a.readmit);
  [[9,10,'FACILITY'],[11,11,'READMIT %'],[12,13,'STATUS']].forEach(([a,b,t2])=>{sum.set(13,a,t2,Object.assign({},th,{h:a===11?'right':'left'}));sum.style(13,a,13,b,th);if(b>a)sum.merge(13,a,13,b);});
  rev.forEach((x,i)=>{const rr=14+i;const cs=cell({});sum.set(rr,9,x.name,Object.assign({},cs,{b:1,indent:1}));sum.style(rr,9,rr,10,cs);sum.merge(rr,9,rr,10);sum.set(rr,11,x.readmit/100,Object.assign({},cs,{h:'right',fmt:'0.0%',indent:1}));sum.set(rr,12,stat(x.readmit),Object.assign({},cs,{h:'center',b:1}));sum.style(rr,12,rr,13,cs);sum.merge(rr,12,rr,13);sum.height(rr,22);});
  sum.cfStatus('L14:L'+(13+rev.length),STATUS_DXF);
  sum.chart({at:{c1:2,r1:20,c2:9,r2:39},title:'Readmission rate by month vs target',catRef:"'Monthly trend'!$A$2:$A$"+lm,cats:Mo.map((x)=>x.m),lblFmt:'0.0%',axFmt:'0%',series:[{name:'Readmit %',nameRef:"'Monthly trend'!$B$1",ref:"'Monthly trend'!$B$2:$B$"+lm,vals:Mo.map((x)=>x.readmit/100),color:'4520B8',ptColors:Mo.map((_,i)=>i===nM-1?'6D42E8':'4520B8')},{name:'Target %',type:'line',nameRef:"'Monthly trend'!$C$1",ref:"'Monthly trend'!$C$2:$C$"+lm,vals:Mo.map(()=>TG/100),color:'18845B'}]});

  /* Charts sheet: interactive analytics dashboard */
  {
    const FMs="'Facility metrics'!",MT="'Monthly trend'!";const DT=64,SEL='$D$7';const R0=DT+1;
    const PUR=['4520B8','6D42E8','9B7CF0','2E1478'];
    const MET=['Readmission rate %','Plan adherence %','Check-ins done %','Satisfaction (of 5)'];
    const mv=(x)=>[x.readmit,x.adh,x.chk,x.csat];
    ch.set(7,2,'VIEW',{b:1,sz:10,color:C.P,fill:C.LAV,h:'center',v:'center'});
    ch.set(7,3,'Metric',{b:1,sz:11,color:C.INK,fill:C.LAV,h:'center',v:'center'});
    ch.set(7,4,MET[0],{b:1,sz:12,color:'#FFFFFF',fill:C.P,h:'center',v:'center'});ch.style(7,4,7,5,{fill:C.P});ch.merge(7,4,7,5);
    ch.set(7,6,'◀ Choose a metric in the purple cell. The facility comparison and takeaways update.',{sz:10,i:1,color:C.MUT,v:'center',indent:1});ch.merge(7,6,7,13);ch.height(7,32);ch.dv('D7',MET);
    const ro=w('readmit')/100;
    kpiTiles(ch,9,[
     {l:'30-DAY READMISSION',v:{f:FMs+'C'+tr,v:ro},fmt:'0.0%',d:(ro*100<=TG?'Within':'Above')+' the '+TG+'% target',tone:ro*100<=TG?'ok':'warn'},
     {l:'PLAN ADHERENCE',v:{f:FMs+'F'+tr,v:w('adh')/100},fmt:'0%',d:N.toLocaleString('en-IN')+' patients',tone:'ok'},
     {l:'CHECK-INS DONE',v:{f:FMs+'G'+tr,v:w('chk')/100},fmt:'0%',d:'Remote check-ins',tone:'warn'},
     {l:'SATISFACTION',v:{f:FMs+'H'+tr,v:w('csat')},fmt:'0.0',d:'Out of 5',tone:'ok'}],2,3);
    const list=MET.map((m,i)=>[m,i+1]);
    const sel=F.map((x,i)=>[x.name,{f:'CHOOSE(MATCH('+SEL+',$E$'+R0+':$E$'+(DT+4)+',0),'+FMs+'$C$'+(i+2)+'*100,'+FMs+'$F$'+(i+2)+'*100,'+FMs+'$G$'+(i+2)+'*100,'+FMs+'$H$'+(i+2)+')',v:mv(x)[0]}]);
    sectionHead(ch,DT-4,2,13,'Chart data (live formulas over Facility metrics)');
    dataTable(ch,DT,2,['FACILITY','SELECTED'],sel,'0.0');dataTable(ch,DT,5,['METRIC LIST','#'],list,'0');
    ch.cfBar('C'+R0+':C'+(DT+nF),'#9B7CF0');
    gridChart(ch,{t:13,c1:2,mode:'col',title:'Readmission rate by month vs target',fmt:'0.0%',note:'Target '+TG+'% · latest month in lighter purple',items:Mo.map((x,i)=>({label:x.m,ref:MT+'$B$'+(i+2),v:x.readmit/100,color:i===nM-1?'8F6DF0':(i%2?'5B34CC':'4520B8')}))});
    gridChart(ch,{t:13,c1:8,mode:'col',title:'Facility comparison, selected metric',fmt:'0.0',note:'Change the metric in the dropdown above',items:F.map((x,i)=>({label:x.name,ref:'C'+(R0+i),v:sel[i][1].v,color:PUR[i%PUR.length]}))});
    gridChart(ch,{t:33,c1:2,mode:'hbar',title:'Plan adherence by facility',fmt:'0%',items:F.map((x,i)=>({label:x.name,ref:FMs+'$F$'+(i+2),v:x.adh/100,color:'6D42E8'}))});
    gridChart(ch,{t:33,c1:8,mode:'tiles',title:'Patients by facility, share',fmt:'#,##0',sum:FMs+'$B$2:$B$'+lf,items:F.map((x,i)=>({label:x.name,ref:FMs+'$B$'+(i+2),v:x.n,vtxt:x.n.toLocaleString('en-IN'),color:PUR[i%PUR.length]}))});
    const mcat=MT+'$A$2:$A$'+lm,ccat='Charts!$B$'+R0+':$B$'+(DT+nF);
    ch.chart({at:{c1:2,r1:13,c2:8,r2:32},title:'Readmission rate by month vs target',catRef:mcat,cats:Mo.map((x)=>x.m),lblFmt:'0.0%',axFmt:'0%',gap:70,series:[{name:'Readmit %',nameRef:MT+'$B$1',ref:MT+'$B$2:$B$'+lm,vals:Mo.map((x)=>x.readmit/100),color:'4520B8',ptColors:Mo.map((_,i)=>i===nM-1?'8F6DF0':(i%2?'5B34CC':'4520B8'))},{name:'Target %',type:'line',nameRef:MT+'$C$1',ref:MT+'$C$2:$C$'+lm,vals:Mo.map(()=>TG/100),color:THEME.green}]});
    ch.chart({at:{c1:8,r1:13,c2:14,r2:32},title:'Facility comparison, selected metric',catRef:ccat,cats:F.map((x)=>x.name),lblFmt:'0.0',gap:70,series:[{name:'Selected metric',nameRef:'Charts!$C$'+DT,ref:'Charts!$C$'+R0+':$C$'+(DT+nF),vals:sel.map((x)=>x[1].v),color:'4520B8',ptColors:PUR}]});
    ch.chart({at:{c1:2,r1:33,c2:8,r2:52},title:'Plan adherence by facility',type:'hbar',catRef:FMs+'$A$2:$A$'+lf,cats:F.map((x)=>x.name),lblFmt:'0%',gap:45,axMax:1,series:[{name:'Adherence %',nameRef:FMs+'$F$1',ref:FMs+'$F$2:$F$'+lf,vals:F.map((x)=>x.adh/100),color:'6D42E8'}]});
    ch.chart({at:{c1:8,r1:33,c2:14,r2:52},title:'Patients by facility, share',type:'doughnut',catRef:FMs+'$A$2:$A$'+lf,cats:F.map((x)=>x.name),lblFmt:'0%',series:[{name:'Patients',nameRef:FMs+'$B$1',ref:FMs+'$B$2:$B$'+lf,vals:F.map((x)=>x.n)}]});
    sectionHead(ch,54,2,13,'Key takeaways');
    const vals=sel.map((x)=>x[1].v);const best=F[vals.indexOf(Math.min(...vals))].name;const lastM=Mo[nM-1].readmit;const above=F.filter((x)=>x.readmit>TG).length;
    const NR='$B$'+R0+':$B$'+(DT+nF),VR='$C$'+R0+':$C$'+(DT+nF),LR='$E$'+R0+':$E$'+(DT+4);
    const cards=[
     ['LEADING FACILITY',{f:'INDEX('+NR+',MATCH(IF(MATCH('+SEL+','+LR+',0)=1,MIN('+VR+'),MAX('+VR+')),'+VR+',0))&" leads on "&'+SEL,v:best+' leads on '+MET[0]}],
     ['LATEST MONTH',{f:'TEXT('+MT+'$B$'+lm+',"0.0%")&IF('+MT+'$B$'+lm+'<='+MT+'$C$'+lm+'," is within"," is above")&" the "&TEXT('+MT+'$C$'+lm+',"0%")&" readmission target"',v:lastM.toFixed(1)+'%'+(lastM<=TG?' is within':' is above')+' the '+TG+'% readmission target'}],
     ['FACILITIES TO REVIEW',{f:'COUNTIF('+FMs+'$C$2:$C$'+lf+',">"&'+FMs+'$D$2)&" of '+nF+' facilities are above the readmission target"',v:above+' of '+nF+' facilities are above the readmission target'}]];
    cards.forEach((cd,i)=>{const c=2+i*4;const acc={bl:['thick',C.P],fill:C.BG};
      ch.set(56,c,cd[0],Object.assign({b:1,sz:9,color:C.P,indent:1,v:'center'},acc));ch.style(56,c,56,c+3,{fill:C.BG});ch.style(56,c,56,c,acc);ch.merge(56,c,56,c+3);
      ch.set(57,c,cd[1],Object.assign({b:1,sz:12,color:C.INK,wrap:1,indent:1,v:'top'},acc));ch.style(57,c,59,c+3,{fill:C.BG});for(let q=57;q<=59;q++)ch.style(q,c,q,c,acc);ch.merge(57,c,59,c+3);
    });ch.height(56,22);[57,58,59].forEach((q)=>ch.height(q,20));
  }
  sectionHead(sum,20,10,13,'What the numbers say');
  ['Readmissions are below the target in the latest months.','Facilities above the target need a review of discharge follow-up.','Check-in completion keeps rising each month.','Open Facility metrics to filter and sort every row.'].forEach((tx3,i)=>{sum.set(21+i*2,10,tx3,{sz:11,color:C.INK,wrap:1,v:'top',indent:1});sum.merge(21+i*2,10,22+i*2,13);});
  sum.set(41,2,'Sample values illustrate the layout. Generated '+(d.generated||new Date()).toLocaleString('en-IN')+'.',{sz:9,color:C.MUT,i:1});sum.merge(41,2,41,13);
  bk.sheets=[sum,ch,fm,mt,ab];
  return bk.build();
}
const SAMPLE_PAY={period:'1 to 31 Oct 2026',by:'[User]',tx:[
 {date:D(2026,10,1),order:'VQ-100412',gw:'Razorpay',method:'UPI',payId:'pay_Qx7…k2m',cur:'INR',amt:1899,inr:1899,status:'Captured',settled:D(2026,10,3)},
 {date:D(2026,10,2),order:'VQ-100418',gw:'Razorpay',method:'Card',payId:'pay_Rm2…p9a',cur:'INR',amt:1499,inr:1499,status:'Captured',settled:D(2026,10,4)},
 {date:D(2026,10,3),order:'VQ-100425',gw:'Stripe',method:'Card',payId:'pi_3Pq…81x',cur:'USD',amt:89.99,inr:7499,status:'Captured',settled:D(2026,10,6)},
 {date:D(2026,10,4),order:'VQ-100431',gw:'Razorpay',method:'Netbanking',payId:'pay_Tn5…c1d',cur:'INR',amt:2499,inr:2499,status:'Failed',settled:null},
 {date:D(2026,10,5),order:'VQ-100437',gw:'Razorpay',method:'UPI',payId:'pay_Uv8…q4e',cur:'INR',amt:799,inr:799,status:'Captured',settled:D(2026,10,7)},
 {date:D(2026,10,7),order:'VQ-100446',gw:'Stripe',method:'Apple Pay',payId:'pi_3Qa…77z',cur:'USD',amt:34.5,inr:2875,status:'Captured',settled:D(2026,10,10)},
 {date:D(2026,10,8),order:'VQ-100452',gw:'Razorpay',method:'Wallet',payId:'pay_Wz1…h6f',cur:'INR',amt:349,inr:349,status:'Captured',settled:D(2026,10,10)},
 {date:D(2026,10,9),order:'VQ-100459',gw:'Razorpay',method:'Card',payId:'pay_Xa4…j3g',cur:'INR',amt:7999,inr:7999,status:'Refunded',settled:D(2026,10,12)},
 {date:D(2026,10,11),order:'VQ-100463',gw:'Stripe',method:'Card',payId:'pi_3Rb…02y',cur:'USD',amt:149,inr:12417,status:'Captured',settled:D(2026,10,14)},
 {date:D(2026,10,12),order:'VQ-100470',gw:'Razorpay',method:'UPI',payId:'pay_Yb6…m8h',cur:'INR',amt:1299,inr:1299,status:'Pending',settled:null},
 {date:D(2026,10,14),order:'VQ-100478',gw:'Razorpay',method:'UPI AutoPay',payId:'pay_Zc9…n2i',cur:'INR',amt:7999,inr:7999,status:'Captured',settled:D(2026,10,16)},
 {date:D(2026,10,15),order:'VQ-100481',gw:'Stripe',method:'Card',payId:'pi_3Sc…19w',cur:'USD',amt:12,inr:1000,status:'Failed',settled:null}],
 rf:[{date:D(2026,10,12),order:'VQ-100459',gw:'Razorpay',id:'rfnd_Ab3…q7s',amt:7999,reason:'Customer request',status:'Processed',expected:D(2026,10,17)}]};
const SAMPLE_OUT={period:'Quarter [Q] [YYYY]',plan:'[Plan or ACO name]',by:'[User]',target:10,
 fac:[{name:'Facility A',n:412,readmit:6.0,adh:96,chk:88,csat:4.8},{name:'Facility B',n:268,readmit:7.6,adh:93,chk:87,csat:4.7},{name:'Facility C',n:305,readmit:10.4,adh:89,chk:85,csat:4.5},{name:'Facility D',n:190,readmit:11.6,adh:82,chk:83,csat:4.3}],
 mon:[{m:'Month 1',readmit:11.4,chk:80},{m:'Month 2',readmit:10.2,chk:82},{m:'Month 3',readmit:8.8,chk:83},{m:'Month 4',readmit:9.3,chk:84},{m:'Month 5',readmit:7.9,chk:85},{m:'Month 6',readmit:7.2,chk:86}]};

/* ---------- PDF engine (A4, px design units 794 x 1123) ---------- */
const HW={n:[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584],
 b:[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584]};
const CP={'·':0xB7,'–':0x96,'—':0x97,'•':0x95,'×':0xD7,'…':0x85,'’':0x92,'‘':0x91,'“':0x93,'”':0x94,'°':0xB0,'−':0x2D};
const CPW={0xB7:278,0x96:556,0x97:1000,0x95:350,0xD7:584,0x85:1000,0x92:222,0x91:222,0x93:333,0x94:333,0xB0:400};
const cw=(code,b)=>(code>=32&&code<=126)?HW[b?'b':'n'][code-32]:(CPW[code]||556);
const toCode=(ch)=>{const c=ch.charCodeAt(0);if(c>=32&&c<=126)return c;return CP[ch]!==undefined?CP[ch]:63;};
const RUPEE_W=0.58;
function tw(str,size,bold){let w=0;for(const ch of String(str)){if(ch==='₹')w+=RUPEE_W*size+size*0.06;else w+=cw(toCode(ch),bold)/1000*size;}return w;}
function wrapText(str,w,size,bold){const words=String(str).split(/\s+/);const lines=[];let cur='';for(const wd of words){const t=cur?cur+' '+wd:wd;if(tw(t,size,bold)>w&&cur){lines.push(cur);cur=wd;}else cur=t;}if(cur)lines.push(cur);return lines;}
const K=595.28/794;const PH=841.89;
const rgb=(h)=>{h=h.replace('#','');return [0,2,4].map((i)=>(parseInt(h.substr(i,2),16)/255).toFixed(3)).join(' ');};
const f2=(n)=>(Math.round(n*100)/100).toString();
const pesc=(s)=>s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
function lat1(str){let o='';for(const ch of str)o+=String.fromCharCode(toCode(ch));return pesc(o);}

class Page{
  constructor(doc){this.doc=doc;this.o=[];}
  X(x){return f2(x*K);}Y(y){return f2(PH-y*K);}
  op(s){this.o.push(s);}
  roundPath(x,y,w,h,r){
    r=Math.min(r||0,w/2,h/2);const k=r*0.5523;const X=(v)=>this.X(v),Y=(v)=>this.Y(v);
    if(!r){return X(x)+' '+Y(y+h)+' '+f2(w*K)+' '+f2(h*K)+' re';}
    return [X(x+r)+' '+Y(y)+' m',X(x+w-r)+' '+Y(y)+' l',X(x+w-r+k)+' '+Y(y)+' '+X(x+w)+' '+Y(y+r-k)+' '+X(x+w)+' '+Y(y+r)+' c',X(x+w)+' '+Y(y+h-r)+' l',X(x+w)+' '+Y(y+h-r+k)+' '+X(x+w-r+k)+' '+Y(y+h)+' '+X(x+w-r)+' '+Y(y+h)+' c',X(x+r)+' '+Y(y+h)+' l',X(x+r-k)+' '+Y(y+h)+' '+X(x)+' '+Y(y+h-r+k)+' '+X(x)+' '+Y(y+h-r)+' c',X(x)+' '+Y(y+r)+' l',X(x)+' '+Y(y+r-k)+' '+X(x+r-k)+' '+Y(y)+' '+X(x+r)+' '+Y(y)+' c h'].join(' ');
  }
  rect(x,y,w,h,o){o=o||{};const f=o.fill,s=o.stroke;if(!f&&!s)return this;this.op('q');if(f)this.op(rgb(f)+' rg');if(s){this.op(rgb(s)+' RG '+f2((o.sw||1)*K)+' w');if(o.dash)this.op('['+o.dash.map((d)=>f2(d*K)).join(' ')+'] 0 d');}
    this.op(this.roundPath(x,y,w,h,o.r));this.op(f&&s?'B':(f?'f':'S'));this.op('Q');return this;}
  inset(x,y,w,h,color,r,sw){this.rect(x+(sw||1.5)/2,y+(sw||1.5)/2,w-(sw||1.5),h-(sw||1.5),{stroke:color,sw:sw||1.5,r:Math.max(0,(r||0)-0.5)});return this;}
  line(x1,y1,x2,y2,o){o=o||{};this.op('q '+rgb(o.c||'#000000')+' RG '+f2((o.w||1)*K)+' w'+(o.dash?' ['+o.dash.map((d)=>f2(d*K)).join(' ')+'] 0 d':'')+(o.cap?' 1 J':'')+' '+this.X(x1)+' '+this.Y(y1)+' m '+this.X(x2)+' '+this.Y(y2)+' l S Q');return this;}
  poly(pts,o){o=o||{};let p=pts.map((q,i)=>this.X(q[0])+' '+this.Y(q[1])+(i?' l':' m')).join(' ');if(o.close)p+=' h';this.op('q '+(o.fill?rgb(o.fill)+' rg ':'')+(o.stroke?rgb(o.stroke)+' RG '+f2((o.sw||1)*K)+' w 1 j 1 J ':'')+p+' '+(o.fill&&o.stroke?'B':(o.fill?'f':'S'))+' Q');return this;}
  circle(cx,cy,r,o){o=o||{};const k=r*0.5523;const X=(v)=>this.X(v),Y=(v)=>this.Y(v);
    const p=[X(cx+r)+' '+Y(cy)+' m',X(cx+r)+' '+Y(cy-k)+' '+X(cx+k)+' '+Y(cy-r)+' '+X(cx)+' '+Y(cy-r)+' c',X(cx-k)+' '+Y(cy-r)+' '+X(cx-r)+' '+Y(cy-k)+' '+X(cx-r)+' '+Y(cy)+' c',X(cx-r)+' '+Y(cy+k)+' '+X(cx-k)+' '+Y(cy+r)+' '+X(cx)+' '+Y(cy+r)+' c',X(cx+k)+' '+Y(cy+r)+' '+X(cx+r)+' '+Y(cy+k)+' '+X(cx+r)+' '+Y(cy)+' c h'].join(' ');
    this.op('q '+(o.fill?rgb(o.fill)+' rg ':'')+(o.stroke?rgb(o.stroke)+' RG '+f2((o.sw||1)*K)+' w ':'')+p+' '+(o.fill&&o.stroke?'B':(o.fill?'f':'S'))+' Q');return this;}
  grad(x,y,w,h,r,c1,c2){ // horizontal gradient clipped to rounded rect
    this.op('q '+this.roundPath(x,y,w,h,r)+' W n');const n=64;const a=rgb(c1).split(' ').map(Number),b=rgb(c2).split(' ').map(Number);
    for(let i=0;i<n;i++){const t=i/(n-1);const col=a.map((v,j)=>(v+(b[j]-v)*t).toFixed(3)).join(' ');this.op(col+' rg '+this.X(x+w*i/n)+' '+this.Y(y+h)+' '+f2(w/n*K+0.6)+' '+f2(h*K)+' re f');}
    this.op('Q');return this;}
  rupee(x,y,size,color,bold){ // vector rupee sign. x,y = top-left of text box
    const s=size,w=RUPEE_W*s,top=y+s*0.18,base=y+s*0.18+s*0.7;const lw=(bold?0.095:0.075)*s;
    this.op('q '+rgb(color)+' RG '+f2(lw*K)+' w 0 J 1 j');
    const X=(v)=>this.X(v),Y=(v)=>this.Y(v);
    const x0=x+w*0.06,x1=x+w*0.94;const y1=top+0.02*s,y2=top+0.22*s;
    this.op(X(x0)+' '+Y(y1)+' m '+X(x1)+' '+Y(y1)+' l S');this.op(X(x0)+' '+Y(y2)+' m '+X(x1)+' '+Y(y2)+' l S');
    const midy=top+0.5*s;const cx=x+w*0.62;
    this.op(X(x0)+' '+Y(y1)+' m '+X(cx)+' '+Y(y1)+' '+X(x+w*0.98)+' '+Y(y1+0.04*s)+' '+X(x+w*0.98)+' '+Y(y1+0.18*s)+' c '+X(x+w*0.98)+' '+Y(midy-0.04*s)+' '+X(cx)+' '+Y(midy)+' '+X(x0)+' '+Y(midy)+' c S');
    this.op(X(x0+0.02*s)+' '+Y(midy)+' m '+X(x+w*0.72)+' '+Y(base)+' l S');this.op('Q');}
  text(str,x,y,o){o=o||{};str=String(str);const s=o.s||11,b=!!o.b,col=o.c||'#17143A';const wd=tw(str,s,b);let px=x;if(o.a==='r')px=x-wd;else if(o.a==='c')px=x-wd/2;
    const base=y+s*0.86;const parts=str.split('₹');let cur=px;
    parts.forEach((p,i)=>{if(p){this.op('BT '+rgb(col)+' rg /'+(b?'F2':'F1')+' '+f2(s*K)+' Tf '+this.X(cur)+' '+this.Y(base)+' Td ('+lat1(p)+') Tj ET');cur+=tw(p,s,b);}
      if(i<parts.length-1){this.rupee(cur,y,s,col,b);cur+=RUPEE_W*s+s*0.06;}});
    return wd;}
  para(str,x,y,w,o){o=o||{};const s=o.s||11,lh=o.lh||s*1.5;const ls=wrapText(str,w,s,!!o.b);ls.forEach((l,i)=>this.text(l,x,y+i*lh,o));return ls.length*lh;}
  stream(){return this.o.join('\n');}
}
class Doc{
  constructor(meta){this.meta=meta||{};this.pages=[];this.marks=[];}
  page(){const p=new Page(this);this.pages.push(p);return p;}
  bookmark(title,page,y){this.marks.push({title,page:this.pages.indexOf(page),y:y||0});}
  build(){
    const objs=[];const add=(s)=>{objs.push(s);return objs.length;};
    const m=this.meta;const nP=this.pages.length;
    // object numbering: 1 catalog, 2 pages, 3 F1, 4 F2, 5 info, 6.. pages & contents, then outlines
    const pageBase=6;const pageObj=(i)=>pageBase+i*2;const contentObj=(i)=>pageBase+i*2+1;const outBase=pageBase+nP*2;
    const hasOut=this.marks.length>0;
    objs.push('<< /Type /Catalog /Pages 2 0 R'+(hasOut?' /Outlines '+outBase+' 0 R /PageMode /UseOutlines':'')+' /Lang (en-IN) /ViewerPreferences << /DisplayDocTitle true >> >>');
    objs.push('<< /Type /Pages /Count '+nP+' /Kids ['+this.pages.map((_,i)=>pageObj(i)+' 0 R').join(' ')+'] >>');
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const d=new Date();const pad=(n)=>String(n).padStart(2,'0');const cd='D:'+d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+pad(d.getUTCHours())+pad(d.getUTCMinutes())+pad(d.getUTCSeconds())+'Z';
    const ps=(s)=>'('+lat1(String(s||''))+')';
    objs.push('<< /Title '+ps(m.title)+' /Author '+ps(m.author||'VivoQuest')+' /Subject '+ps(m.subject)+' /Keywords '+ps(m.keywords)+' /Creator (VivoQuest Reports) /Producer (VivoQuest Report Engine) /CreationDate ('+cd+') /ModDate ('+cd+') >>');
    this.pages.forEach((p,i)=>{
      objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+contentObj(i)+' 0 R >>');
      const s=p.stream();objs.push('<< /Length '+s.length+' >>\nstream\n'+s+'\nendstream');
    });
    if(hasOut){
      const n=this.marks.length;objs.push('<< /Type /Outlines /First '+(outBase+1)+' 0 R /Last '+(outBase+n)+' 0 R /Count '+n+' >>');
      this.marks.forEach((mk,i)=>{objs.push('<< /Title '+ps(mk.title)+' /Parent '+outBase+' 0 R'+(i>0?' /Prev '+(outBase+i)+' 0 R':'')+(i<n-1?' /Next '+(outBase+i+2)+' 0 R':'')+' /Dest ['+pageObj(mk.page)+' 0 R /XYZ 0 '+f2(PH-mk.y*K)+' null] >>');});
    }
    let out='%PDF-1.7\n%\xE2\xE3\xCF\xD3\n';const offs=[];
    objs.forEach((o,i)=>{offs.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});
    const xr=out.length;out+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n'+offs.map((o)=>String(o).padStart(10,'0')+' 00000 n \n').join('');
    out+='trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R /Info 5 0 R /ID [<'+hexId(m.title)+'> <'+hexId(m.title+cd)+'>] >>\nstartxref\n'+xr+'\n%%EOF';
    const u=new Uint8Array(out.length);for(let i=0;i<out.length;i++)u[i]=out.charCodeAt(i)&255;return u;
  }
}
function hexId(s){let h=2166136261;let o='';for(let k=0;k<4;k++){for(const ch of String(s)+k){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}o+=h.toString(16).padStart(8,'0');}return o;}

/* ---------- PDF report layouts ---------- */
const PC={P:'#4520B8',ACC:'#6D42E8',LAV:'#EAE4FF',BG:'#F7F5FF',INK:'#17143A',MUT:'#5B6475',LINE:'#E6E2F0',L2:'#EEEBF5',TXT:'#3A3560'};
const TONE={ok:['#DDF3EA','#0F6B47'],warn:['#FDEFD6','#8A500F'],bad:['#FBE4E7','#9C1C2B'],def:['#EAE4FF','#4520B8'],neu:['#EEEBF5','#4B5565']};
const inr2=(n)=>'₹'+n.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtStamp=(d)=>d.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
function chip(g,t,x,y,tone){const c=TONE[tone||'def'];const w=tw(t,10.5,true)+18;g.rect(x,y,w,19,{fill:c[0],r:9.5});g.text(t,x+9,y+4,{s:10.5,b:1,c:c[1]});return w;}
function chrome(g,o){
  g.grad(0,0,794,8,0,PC.P,PC.ACC);
  g.rect(44,28,38,38,{fill:PC.P,r:11});
  const hx=44+8,hy=28+8,k=22/24;const P=(a,b)=>[hx+a*k,hy+b*k];
  g.poly([P(3.5,11),P(12,3.5),P(20.5,11),P(20.5,19),P(3.5,19)],{stroke:'#FFFFFF',sw:1.9*k,close:true});g.circle(...P(10.3,13.1),1.95*k,{fill:'#FFFFFF'});g.circle(...P(13.7,13.1),1.95*k,{fill:'#FFFFFF'});g.poly([P(8.45,13.7),P(15.55,13.7),P(12,17.3)],{fill:'#FFFFFF',close:true});
  g.text(o.brand||'VivoQuest',92,30,{s:19,b:1});g.text(o.tag||'Care at home, together',92,53,{s:10,c:PC.MUT,b:1});
  g.text(o.type,750,29,{s:10.5,b:1,c:PC.P,a:'r'});g.text(o.id,750,45,{s:11,b:1,a:'r'});g.text(o.sub,750,62,{s:10,c:PC.MUT,b:1,a:'r'});
  g.line(44,1063,750,1063,{c:PC.LINE,w:1});
  g.text(o.foot,44,1077,{s:10,c:PC.MUT});g.text('Generated '+fmtStamp(o.when||new Date())+' · Page '+(o.pageNo||1)+' of '+(o.pages||1),750,1077,{s:10,c:PC.MUT,a:'r'});
}
function kpi(g,x,y,w,h,label,val,chipText,tone){g.inset(x,y,w,h,PC.LINE,14);g.text(label,x+14,y+13,{s:10.5,b:1,c:PC.MUT});g.text(val,x+14,y+29,{s:24,b:1});chip(g,chipText,x+14,y+h-30,tone);}
function meter(g,x,y,w,pct,color){g.rect(x,y,w,7,{fill:PC.LAV,r:3.5});if(pct>0)g.rect(x,y,Math.max(7,w*pct/100),7,{fill:color||PC.P,r:3.5});}
function heading(g,t,x,y){g.text(t,x,y,{s:13,b:1});}
function table(g,x,y,w,cols,rows,o){
  o=o||{};const hh=28,rh=o.rh||34;g.rect(x,y,w,hh,{fill:PC.LAV,r:8});let cx=x;const cs=cols.map((c)=>{const o2={x:cx,w:c.w};cx+=c.w;return o2;});
  cols.forEach((c,i)=>{const px=cs[i].x;c.a==='r'?g.text(c.h,px+cs[i].w-8,y+9.5,{s:10,b:1,c:PC.P,a:'r'}):g.text(c.h,px+8,y+9.5,{s:10,b:1,c:PC.P});});
  rows.forEach((r,ri)=>{const ry=y+hh+ri*rh;g.line(x,ry+rh,x+w,ry+rh,{c:PC.L2,w:1});
    r.forEach((v,ci)=>{const c=cols[ci],px=cs[ci].x;const cy=ry+(rh-13)/2;
      if(v&&typeof v==='object'){if(v.chip!==undefined){chip(g,v.chip,px+8,ry+(rh-19)/2,v.tone);}else if(v.meter!==undefined){meter(g,px+8,ry+(rh-7)/2,90,v.meter,v.color);g.text(v.meter+'%',px+106,cy,{s:11.5,b:1});}}
      else if(c.a==='r')g.text(v,px+cs[ci].w-8,cy,{s:11.5,a:'r',b:ci===0&&o.boldFirst});else g.text(v,px+8,cy,{s:11.5,b:ci===0&&o.boldFirst});});});
  return hh+rows.length*rh;
}
function sig(g,y,l1,l2){g.line(44,y,386,y,{c:PC.INK,w:1.5});g.line(408,y,750,y,{c:PC.INK,w:1.5});g.text(l1,44,y+6,{s:10,b:1,c:PC.MUT});g.text(l2,408,y+6,{s:10,b:1,c:PC.MUT});}
function check(g,x,y,on){g.rect(x,y,17,17,on?{fill:'#18845B',r:5}:{stroke:'#C9C3DD',sw:2,r:5});if(on)g.poly([[x+4,y+8.5],[x+7.3,y+12],[x+13,y+5]],{stroke:'#FFFFFF',sw:2.2});}

/* ===== 1. Patient care summary ===== */
function carePdf(d){
  const doc=new Doc({title:'Patient care summary',subject:d.period,keywords:'care summary, vitals, medicines'});const g=doc.page();
  chrome(g,{type:'PATIENT CARE SUMMARY',id:'Report ID '+d.id,sub:'Period: '+d.period,foot:'Confidential. Contains personal health information. VivoQuest supports care and never diagnoses.'});
  let y=96;doc.bookmark('Patient',g,y);
  g.grad(44,y,706,84,14,PC.P,PC.ACC);g.circle(44+16+28,y+42,28,{fill:'#7E62E4'});g.text(d.initials,44+16+28,y+31,{s:18,b:1,c:'#FFFFFF',a:'c'});
  g.text(d.name,134,y+17,{s:20,b:1,c:'#FFFFFF'});g.text(d.line,134,y+46,{s:11.5,c:'#E4DBFF'});
  g.text('Care team',734,y+17,{s:10.5,b:1,c:'#D8CCFF',a:'r'});g.text('Nurse: '+d.nurse,734,y+34,{s:11,b:1,c:'#FFFFFF',a:'r'});g.text('Clinician: '+d.clinician,734,y+50,{s:11,b:1,c:'#FFFFFF',a:'r'});
  y+=100;const tw4=(706-36)/4;
  d.kpis.forEach((k,i)=>kpi(g,44+i*(tw4+12),y,tw4,88,k[0],k[1],k[2],k[3]));
  y+=104;doc.bookmark('Vitals',g,y);
  g.inset(44,y,706,176,PC.LINE,14);heading(g,'Blood pressure, last 7 days',60,y+14);
  g.rect(480,y+17,10,10,{fill:PC.P,r:3});g.text('Systolic',494,y+16,{s:10.5,b:1});g.rect(556,y+17,10,10,{fill:'#B9A6F5',r:3});g.text('Diastolic',570,y+16,{s:10.5,b:1});g.line(640,y+22,656,y+22,{c:'#18845B',w:2,dash:[4,3]});g.text('Goal 130',662,y+16,{s:10.5,b:1});
  const cx0=96,cx1=724,cy0=y+46,cy1=y+136;const vy=(v)=>cy0+(140-v)/80*(cy1-cy0);
  [140,100,60].forEach((v)=>{g.line(cx0,vy(v),cx1,vy(v),{c:PC.L2,w:1});g.text(String(v),cx0-8,vy(v)-6,{s:10,b:1,c:PC.MUT,a:'r'});});
  g.line(cx0,vy(130),cx1,vy(130),{c:'#18845B',w:1.5,dash:[5,4]});
  const n=d.sys.length;const px=(i)=>cx0+30+i*((cx1-cx0-60)/(n-1));
  g.poly(d.sys.map((v,i)=>[px(i),vy(v)]),{stroke:PC.P,sw:2.5});g.poly(d.dia.map((v,i)=>[px(i),vy(v)]),{stroke:'#B9A6F5',sw:2.5});
  d.sys.forEach((v,i)=>g.circle(px(i),vy(v),3.5,{fill:PC.P}));d.dia.forEach((v,i)=>g.circle(px(i),vy(v),3.5,{fill:'#B9A6F5'}));
  d.sys.forEach((v,i)=>g.text('Day '+(i+1),px(i),cy1+12,{s:10,b:1,c:PC.MUT,a:'c'}));
  y+=192;doc.bookmark('Medicines',g,y);heading(g,'Medicines and adherence',44,y);
  const mh=table(g,44,y+22,706,[{h:'MEDICINE',w:150},{h:'DOSE',w:120},{h:'WHEN',w:130},{h:'ADHERENCE',w:170},{h:'STATUS',w:136}],d.meds.map((m)=>[m.name,m.dose,m.when,{meter:m.pct},{chip:m.status,tone:m.tone}]));
  y+=22+mh+18;doc.bookmark('Goals and visits',g,y);
  g.rect(44,y,376,172,{fill:PC.BG,r:14});heading(g,'Care plan goals',60,y+14);
  d.goals.forEach((gl,i)=>{const gy=y+42+i*42;g.text(gl[0],60,gy,{s:11.5,b:1});g.text(gl[1]+'%',404,gy,{s:11.5,b:1,a:'r'});g.rect(60,gy+20,344,7,{fill:'#FFFFFF',r:3.5});g.rect(60,gy+20,Math.max(7,344*gl[1]/100),7,{fill:gl[1]===100?'#18845B':PC.P,r:3.5});});
  g.rect(436,y,314,172,{fill:PC.BG,r:14});heading(g,'Upcoming visits',452,y+14);
  d.visits.forEach((v,i)=>{const vy2=y+46+i*40;const w=chip(g,v[0],452,vy2,'def');g.text(v[1],452+w+10,vy2+3,{s:11.5,b:1});});
  y+=188;doc.bookmark('Nurse notes',g,y);
  g.inset(44,y,706,102,PC.LINE,14);heading(g,'Nurse notes',60,y+14);g.para(d.note,60,y+38,674,{s:11.5,c:PC.TXT,lh:17.5});
  sig(g,1018,'Nurse signature and date','Clinician signature and date');
  return doc.build();
}
const SAMPLE_CARE={id:'VQ-CS-[000000]',period:'[DD Mon YYYY] to [DD Mon YYYY]',initials:'PN',name:'[Patient name]',line:'[Age] years · [Sex] · MRN [MRN] · Primary condition: [Condition]',nurse:'[Nurse name]',clinician:'[Clinician name]',
 kpis:[['Medicine adherence','92%','On track','ok'],['Average blood pressure','128/82','Watch','warn'],['Oxygen saturation','97%','Normal range','ok'],['Pain score','2 / 10','Improving','ok']],
 sys:[124,129,122,131,126,134,130],dia:[80,84,79,86,81,85,79],
 meds:[{name:'[Medicine 1]',dose:'[Dose]',when:'Morning',pct:96,status:'On track',tone:'ok'},{name:'[Medicine 2]',dose:'[Dose]',when:'Morning, night',pct:88,status:'1 missed dose',tone:'warn'},{name:'[Medicine 3]',dose:'[Dose]',when:'Night',pct:100,status:'On track',tone:'ok'}],
 goals:[['Walk 20 minutes a day',70],['Low-salt meals, 6 of 7 days',85],['Record vitals twice a day',100]],visits:[['[Date]','Nurse wellness visit'],['[Date]','Physiotherapy visit'],['[Date]','Clinician video review']],
 note:'[Nurse note: one short paragraph on how the week went, what changed, and what the family should watch for.]'};

/* ===== 2. Discharge summary ===== */
function dischargePdf(d){
  const doc=new Doc({title:'Discharge summary',subject:'Discharge summary',keywords:'discharge, recovery plan'});const g=doc.page();
  chrome(g,{type:'DISCHARGE SUMMARY',id:'Report ID '+d.id,sub:'Prepared by the discharge planner',foot:'Confidential. Contains personal health information. VivoQuest supports care and never diagnoses.'});
  let y=96;doc.bookmark('Patient and stay',g,y);
  const w1=280,w2=200,gap=12;
  g.rect(44,y,w1,96,{fill:PC.BG,r:14});g.text('PATIENT',60,y+13,{s:10,b:1,c:PC.MUT});g.text(d.name,60,y+28,{s:18,b:1});g.text(d.line,60,y+54,{s:11.5});g.text('Caregiver: '+d.caregiver,60,y+72,{s:11.5});
  g.rect(44+w1+gap,y,w2,96,{fill:PC.BG,r:14});g.text('ADMITTED',60+w1+gap,y+13,{s:10,b:1,c:PC.MUT});g.text(d.admitted,60+w1+gap,y+27,{s:12.5,b:1});g.text('DISCHARGED',60+w1+gap,y+52,{s:10,b:1,c:PC.MUT});g.text(d.discharged,60+w1+gap,y+66,{s:12.5,b:1});
  const done=d.checklist.filter((c)=>c[1]).length;
  g.rect(44+w1+w2+2*gap,y,706-w1-w2-2*gap,96,{fill:'#DDF3EA',r:14});g.text('READINESS',60+w1+w2+2*gap,y+13,{s:10,b:1,c:'#0F6B47'});g.text(done+' of '+d.checklist.length,60+w1+w2+2*gap,y+28,{s:26,b:1,c:'#0F6B47'});g.text('checklist items done',60+w1+w2+2*gap,y+62,{s:11,b:1,c:'#0F6B47'});
  y+=112;doc.bookmark('Hospital course',g,y);
  const ph=wrapText(d.course,674,11.5,false).length*17.5;const ch=14+13+10+ph+16;
  g.inset(44,y,706,ch,PC.LINE,14);heading(g,'Reason for admission and hospital course',60,y+14);g.para(d.course,60,y+38,674,{s:11.5,c:PC.TXT,lh:17.5});
  y+=ch+16;doc.bookmark('Checklist and timeline',g,y);
  heading(g,'Discharge checklist',44,y);d.checklist.forEach((c,i)=>{const cy=y+24+i*35;check(g,44,cy+8,c[1]);g.text(c[0],72,cy+11,{s:11.5,b:1});g.line(44,cy+34,380,cy+34,{c:PC.L2,w:1});});
  heading(g,'Recovery timeline',414,y);const tl=d.timeline;
  tl.forEach((t,i)=>{const ty=y+28+i*46;g.circle(425,ty+7,5,{fill:PC.P});if(i<tl.length-1)g.line(425,ty+13,425,ty+46,{c:PC.LINE,w:2});g.text(t[0],444,ty,{s:11.5,b:1});g.text(t[1],444,ty+16,{s:10,b:1,c:PC.MUT});});
  y+=24+Math.max(d.checklist.length*35,tl.length*46)+14;doc.bookmark('Medicine changes',g,y);
  heading(g,'Medicine changes',44,y);
  const th=table(g,44,y+22,706,[{h:'MEDICINE',w:160},{h:'DOSE AND SCHEDULE',w:210},{h:'CHANGE',w:150},{h:'REASON',w:186}],d.changes.map((c)=>[c[0],c[1],{chip:c[2],tone:c[3]},c[4]]));
  y+=22+th+18;doc.bookmark('Equipment and warning signs',g,y);
  g.rect(44,y,345,128,{fill:PC.BG,r:14});heading(g,'Home equipment and nutrition',60,y+14);d.equipment.forEach((e,i)=>g.text(e,60,y+42+i*24,{s:11.5,b:1}));
  g.rect(405,y,345,128,{fill:'#FBE4E7',r:14});g.text('Call us or seek care urgently if',421,y+14,{s:13,b:1,c:'#9C1C2B'});d.warn.forEach((e,i)=>g.text(e,421,y+42+i*21,{s:11.5,b:1,c:'#5E1019'}));
  sig(g,1018,'Discharge planner signature and date','Patient or caregiver acknowledgement');
  return doc.build();
}
const SAMPLE_DISCH={id:'VQ-DS-[000000]',name:'[Patient name]',line:'[Age] years · [Sex] · MRN [MRN]',caregiver:'[Caregiver name], [Phone]',admitted:'[DD Mon YYYY]',discharged:'[DD Mon YYYY]',
 course:'Primary diagnosis: [Primary diagnosis]. [Two or three sentences from the clinician on what happened, what treatment was given, and how the patient is doing at discharge.]',
 checklist:[['Medicines reconciled by a pharmacist',1],['Caregiver trained on daily care',1],['Home safety review booked',1],['Equipment ordered and approved',1],['Follow-up appointments scheduled',1],['Transport home confirmed',0]],
 timeline:[['Day of discharge','Nurse call and first vitals check'],['Day 2','Nurse home visit'],['Day 7','Clinician video review'],['Day 14','Physiotherapy visit'],['Day 30','Outcome check and care plan update']],
 changes:[['[Medicine 1]','[Dose], morning','New','ok','[Reason]'],['[Medicine 2]','[Dose], morning and night','Dose changed','warn','[Reason]'],['[Medicine 3]','Stopped','Stopped','bad','[Reason]']],
 equipment:['Digital BP monitor · Delivered','Low-sodium meal kit, 7 days · Ordered','Weekly pill organiser · Ordered'],warn:['[Warning sign 1]','[Warning sign 2]','[Warning sign 3]','Care desk: [Phone number], 24 hours']};

/* ===== 3. Outcomes report ===== */
function outcomesPdf(d){
  const doc=new Doc({title:'Outcomes report',subject:d.period,keywords:'outcomes, readmission, adherence, ACO'});const g=doc.page();
  const TG=d.target;const stat=(v)=>v<=TG?['On target','ok']:(v<=TG*1.1?['Watch','warn']:['Needs action','bad']);
  const N=d.fac.reduce((a,x)=>a+x.n,0);const wv=(k)=>d.fac.reduce((a,x)=>a+x.n*x[k],0)/N;
  chrome(g,{type:'OUTCOMES REPORT',id:'Report ID '+d.id,sub:'Health plan and ACO · '+d.period,foot:'Confidential. Prepared for '+d.plan+'. Contains aggregated health data.'});
  let y=96;doc.bookmark('Executive summary',g,y);
  g.grad(44,y,706,122,18,PC.INK,PC.P);g.text('EXECUTIVE SUMMARY',68,y+20,{s:10.5,b:1,c:'#D8CCFF'});
  const hl=wrapText(d.headline,640,24,true);hl.forEach((l,i)=>g.text(l,68,y+40+i*29,{s:24,b:1,c:'#FFFFFF'}));
  g.para(d.summary,68,y+42+hl.length*29+6,640,{s:12,c:'#EAE4FF',lh:18});
  y+=138;const ro=wv('readmit'),ad=wv('adh'),ck=d.mon[d.mon.length-1].chk,cs=wv('csat');const tw4=(706-36)/4;
  const kp=[['30-day readmission rate',ro.toFixed(1)+'%',(ro<=TG?'-':'+')+Math.abs(ro-TG).toFixed(1)+' pts vs target',ro<=TG?'ok':'warn'],['Plan adherence',Math.round(ad)+'%',N.toLocaleString('en-IN')+' patients','ok'],['Remote check-ins done',ck+'%','Latest month','warn'],['Patient satisfaction',cs.toFixed(1)+' / 5','All facilities','ok']];
  kp.forEach((k,i)=>kpi(g,44+i*(tw4+12),y,tw4,92,k[0],k[1],k[2],k[3]));
  y+=108;doc.bookmark('Readmission trend',g,y);
  g.inset(44,y,706,206,PC.LINE,14);heading(g,'Readmission rate by month',60,y+14);
  g.rect(552,y+17,10,10,{fill:PC.P,r:3});g.text('Actual',566,y+16,{s:10.5,b:1});g.line(622,y+22,638,y+22,{c:'#18845B',w:2,dash:[4,3]});g.text('Target '+TG+'%',644,y+16,{s:10.5,b:1});
  const x0=84,x1=730,by=y+170,ty=y+50;const vy=(v)=>by-(v/15)*(by-ty);
  [15,10,5,0].forEach((v)=>{g.line(x0,vy(v),x1,vy(v),{c:v===0?'#C9C3DD':PC.L2,w:1});g.text(v+'%',x0-8,vy(v)-6,{s:10,b:1,c:PC.MUT,a:'r'});});
  const bw=62,slot=(x1-x0)/d.mon.length;
  d.mon.forEach((m,i)=>{const bx=x0+slot*i+(slot-bw)/2;g.rect(bx,vy(m.readmit),bw,by-vy(m.readmit),{fill:i===d.mon.length-1?PC.ACC:PC.P,r:6});g.text(m.readmit.toFixed(1),bx+bw/2,vy(m.readmit)-16,{s:10.5,b:1,a:'c'});g.text(m.m,bx+bw/2,by+10,{s:10,b:1,c:PC.MUT,a:'c'});});
  g.line(x0,vy(TG),x1,vy(TG),{c:'#18845B',w:1.5,dash:[5,4]});
  y+=222;doc.bookmark('Performance by facility',g,y);heading(g,'Performance by facility',44,y);
  const th=table(g,44,y+22,706,[{h:'FACILITY',w:170},{h:'PATIENTS',w:90,a:'r'},{h:'READMIT %',w:100,a:'r'},{h:'ADHERENCE',w:200},{h:'STATUS',w:146}],d.fac.map((x)=>{const s=stat(x.readmit);return [x.name,String(x.n),x.readmit.toFixed(1),{meter:x.adh},{chip:s[0],tone:s[1]}];}),{rh:36,boldFirst:true});
  y+=22+th+18;doc.bookmark('Insights',g,y);
  g.rect(44,y,346,104,{fill:PC.BG,r:14});g.text('WHAT WORKED',60,y+14,{s:10.5,b:1,c:PC.P});g.para(d.worked,60,y+36,314,{s:11.5,lh:17});
  g.rect(404,y,346,104,{fill:'#FDEFD6',r:14});g.text('WHAT NEEDS ATTENTION',420,y+14,{s:10.5,b:1,c:'#8A500F'});g.para(d.attention,420,y+36,314,{s:11.5,c:'#4A2C06',lh:17});
  y+=122;g.para('Method. '+d.method+' Sample values shown to illustrate the template layout.',44,y,706,{s:10,c:PC.MUT,lh:14.5});
  return doc.build();
}
const SAMPLE_OUTPDF=Object.assign({},{id:'VQ-OR-[000000]',plan:'[Plan or ACO name]',period:'Quarter [Q] [YYYY]',
 headline:'Fewer returns to hospital, steadier recovery at home',summary:'[Two sentences summarising the quarter for [Plan or ACO name]: the headline result, the main driver, and the one action recommended for next quarter.]',
 worked:'[Insight 1: the practice or programme most linked to the improvement.]',attention:'[Insight 2: the facility or group behind the gap and the suggested fix.]',method:'[Describe cohort, data sources, period and how rates are calculated.]'});

/* ===== 4. Tax invoice ===== */
function invoicePdf(d){
  const doc=new Doc({title:'Tax invoice '+d.id,subject:'Tax invoice and payment receipt',keywords:'invoice, receipt, payment'});const g=doc.page();
  chrome(g,{brand:'VivoQuest Marketplace',tag:'by IGVP',type:'TAX INVOICE AND PAYMENT RECEIPT',id:'Invoice '+d.id,sub:'Order '+d.order+' · '+d.date,foot:'This is a computer-generated invoice and needs no signature.'});
  let y=96;doc.bookmark('Parties and payment',g,y);
  g.rect(44,y,236,104,{fill:PC.BG,r:14});g.text('SOLD BY',60,y+13,{s:10,b:1,c:PC.MUT});d.seller.forEach((l,i)=>g.text(l,60,y+32+i*18,{s:11.5,b:1}));
  g.rect(292,y,236,104,{fill:PC.BG,r:14});g.text('BILLED TO',308,y+13,{s:10,b:1,c:PC.MUT});d.buyer.forEach((l,i)=>g.text(l,308,y+32+i*18,{s:11.5,b:1}));
  g.rect(540,y,210,104,{fill:'#DDF3EA',r:14});chip(g,'PAID',556,y+14,'ok');
  const items=d.items;const sub=items.reduce((a,i)=>a+i.qty*i.unit,0);const disc=d.couponPct?Math.round(sub*d.couponPct)/100:0;const total=sub-disc+d.shipping;
  g.text(inr2(total),556,y+44,{s:24,b:1,c:'#0F6B47'});g.text('Amount received',556,y+78,{s:10,b:1,c:'#0F6B47'});
  y+=124;doc.bookmark('Items',g,y);heading(g,'Items',44,y);
  const th=table(g,44,y+22,706,[{h:'ITEM',w:250},{h:'TYPE',w:130},{h:'QTY',w:60,a:'r'},{h:'UNIT PRICE',w:130,a:'r'},{h:'AMOUNT',w:136,a:'r'}],items.map((i)=>[i.name,i.type,String(i.qty),inr2(i.unit),inr2(i.qty*i.unit)]),{rh:38});
  y+=22+th+22;doc.bookmark('Payment and totals',g,y);
  g.rect(44,y,360,176,{fill:PC.BG,r:14});heading(g,'Payment details',60,y+14);
  d.pay.forEach((r,i)=>{const ry=y+42+i*22;g.text(r[0],60,ry,{s:11.5,c:PC.MUT});if(r[2])chip(g,r[1],388-tw(r[1],10.5,true)-18,ry-3,'ok');else g.text(r[1],388,ry,{s:11.5,b:1,a:'r'});});
  const sx=430,sw=320;heading(g,'Summary',sx,y+14);
  const rows=[['Subtotal',inr2(sub)],['Coupon '+d.coupon,'- '+inr2(disc)],['Delivery',d.shipping?inr2(d.shipping):'Free']];rows.forEach((r,i)=>{const ry=y+42+i*24;g.text(r[0],sx,ry,{s:12});g.text(r[1],sx+sw,ry,{s:12,b:1,a:'r',c:i===1?'#0F6B47':PC.INK});});
  g.line(sx,y+118,sx+sw,y+118,{c:PC.INK,w:1.5});g.text('Total paid',sx,y+128,{s:15,b:1});g.text(inr2(total),sx+sw,y+128,{s:15,b:1,a:'r'});
  g.para('Prices include GST. [Tax breakup by rate to be added from the billing system.]',sx,y+152,sw,{s:10,c:PC.MUT,lh:14});
  y+=196;g.inset(44,y,706,96,PC.LINE,14);heading(g,'What happens next',60,y+14);g.para(d.next,60,y+38,674,{s:11.5,c:PC.TXT,lh:19});
  y+=122;g.para('Returns and refunds. [Add policy text.] Refunds go to the original payment method.',44,y,560,{s:10,c:PC.MUT,lh:15});g.para('Support. [support email] · [support phone]',44,y+34,560,{s:10,c:PC.MUT,lh:15});
  g.rect(662,y-6,88,88,{stroke:'#C9C3DD',sw:2,r:10,dash:[5,4]});g.text('Verification',706,y+26,{s:9.5,b:1,c:PC.MUT,a:'c'});g.text('QR code',706,y+40,{s:9.5,b:1,c:PC.MUT,a:'c'});
  return doc.build();
}
const SAMPLE_INV={id:'VQ-INV-[000000]',order:'VQ-[000000]',date:'[DD Mon YYYY]',seller:['[Legal entity name]','[Registered address]','GSTIN [GSTIN] · PAN [PAN]'],buyer:['[Customer name]','[Billing address]','[Email] · [Phone]'],
 items:[{name:'Digital BP monitor',type:'Shipped',qty:1,unit:1899},{name:'Low-sodium meal kit, 7 days',type:'Shipped',qty:1,unit:1499},{name:'Nurse wellness visit',type:'Booked visit',qty:1,unit:799}],couponPct:10,coupon:'VIVO10',shipping:0,
 pay:[['Gateway','Razorpay'],['Method','UPI'],['Payment ID','pay_[14 characters]'],['Gateway order ID','order_[14 characters]'],['Paid on','[DD Mon YYYY, hh:mm]'],['Verification','Signature verified',1]],
 next:'Equipment is approved by a nurse before dispatch. Your visit is booked for [Day, time slot]. Track every order in Orders and payments inside VivoQuest.'};


/* ---------- Generic themed table report (Excel + PDF) ---------- */
const TBL_OK=['Paid','Success','Settled','Approved','Active','Compliant','Passed','Resolved','Closed','Delivered','Filed','On time','Completed','Live','Captured','Processed','Reconciled','Verified','Published','Done','Granted','Healthy','Open - safe'];
const TBL_WARN=['Pending','Scheduled','Due','Open','In review','Processing','Draft','Shipped','Packed','On hold','Unpublished','Expiring','Partial','Refunded','Initiated','Watch','Medium','Upcoming','Review','Waiting','Hidden'];
const TBL_BAD=['Failed','Overdue','Rejected','Denied','Blocked','Suspended','Non-compliant','Breached','High','Critical','Needs action','Cancelled','Disputed','Declined','Expired','Escalated','Locked out'];
const TBL_DXF=(()=>{const m={};TBL_OK.forEach((k)=>m[k]={fill:'#DDF3EA',color:'#0F6B47',b:1});TBL_WARN.forEach((k)=>m[k]={fill:'#FDEFD6',color:'#8A500F',b:1});TBL_BAD.forEach((k)=>m[k]={fill:'#FBE4E7',color:'#9C1C2B',b:1});return m;})();
const tblTone=(s)=>TBL_OK.indexOf(s)>=0?'ok':TBL_WARN.indexOf(s)>=0?'warn':TBL_BAD.indexOf(s)>=0?'bad':'def';
const RE_STATUS=/status|state|result|priority|risk|severity|outcome/i;
const RE_ID=/(^|\b)(id|ref|reference|no\.?|number|code|pin|pincode|phone|mobile|utr|gstin|pan|account|ticket|order|invoice)(\b|$)/i;
const RE_MONEY=/inr|₹|amount|revenue|fee|price|balance|net|gross|total|paid|gst|tax|refund|mrp|payout|deduction|cost|spend|sales/i;
const RE_COUNT=/count|qty|quantity|units|days|rows|number of|orders$|members|users|visits/i;
function tblCell(v,h){
  if(v instanceof Date)return {t:'date',v};
  if(v===null||v===undefined||v==='')return {t:'text',v:''};
  if(typeof v==='number'){const money=RE_MONEY.test(h)&&!RE_COUNT.test(h);return {t:money?'money':'num',v};}
  const s=String(v).trim();let m;
  if((m=s.match(/^₹\s?(-?[\d,]+(?:\.\d+)?)$/)))return {t:'money',v:parseFloat(m[1].replace(/,/g,''))};
  if((m=s.match(/^(-?\d+(?:\.\d+)?)\s?%$/)))return {t:'pct',v:parseFloat(m[1])/100,dp:(m[1].split('.')[1]||'').length};
  if(!RE_ID.test(h)&&(m=s.match(/^-?[\d,]+(?:\.\d+)?$/))&&(s.indexOf(',')>0||s.length<=9)&&!/^0\d/.test(s))return {t:RE_MONEY.test(h)&&!RE_COUNT.test(h)?'money':'num',v:parseFloat(s.replace(/,/g,''))};
  return {t:'text',v:s};
}
function tblProfile(head,rows){
  return head.map((h,ci)=>{const cs=rows.map((r)=>tblCell(r[ci],h));const non=cs.filter((c)=>c.v!==''&&c.v!==undefined);
    const kinds={};non.forEach((c)=>kinds[c.t]=(kinds[c.t]||0)+1);const main=Object.keys(kinds).sort((a,b)=>kinds[b]-kinds[a])[0]||'text';
    const numeric=non.length>0&&['money','num','pct'].indexOf(main)>=0&&non.every((c)=>['money','num','pct'].indexOf(c.t)>=0);
    const dp=non.some((c)=>c.t==='pct'&&c.dp>0)?1:0;
    const intOnly=non.every((c)=>Number.isInteger(c.v));
    const status=RE_STATUS.test(h)&&main==='text';const date=non.length>0&&non.every((c)=>c.t==='date');
    return {h,cs,main,numeric,status,date,dp,intOnly,money:numeric&&main==='money'};});
}
function tblFmt(p){return p.main==='money'?(p.intOnly?'"₹"#,##0':'"₹"#,##0.00'):p.main==='pct'?(p.dp?'0.0%':'0%'):p.main==='num'?(p.intOnly?'#,##0':'#,##0.00'):p.date?dateFmt:null;}
function tblShow(c,p){
  if(c.v===''||c.v===undefined)return '';
  if(c.t==='money')return '₹'+c.v.toLocaleString('en-IN',{minimumFractionDigits:p.intOnly?0:2,maximumFractionDigits:2});
  if(c.t==='pct')return (c.v*100).toFixed(p.dp?1:0)+'%';
  if(c.t==='num')return c.v.toLocaleString('en-IN',{maximumFractionDigits:2});
  if(c.t==='date')return c.v.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  return String(c.v);
}
function tblMeta(s){
  const now=new Date();const pad=(n)=>String(n).padStart(2,'0');
  const id='RPT-'+String(now.getFullYear()).slice(2)+pad(now.getMonth()+1)+pad(now.getDate())+'-'+pad(now.getHours())+pad(now.getMinutes());
  return {id,now,title:s.title,module:(s.module||'ADMIN CONSOLE').toUpperCase(),sub:s.subtitle||'',who:s.by||'Administrator console',foot:s.foot||'Confidential. Generated from the VivoQuest Administrator console. Figures are sample data.'};
}
function tblKpis(s,prof,n){
  if(s.kpis&&s.kpis.length)return s.kpis.slice(0,4);
  const out=[{l:'RECORDS',v:n,fmt:'#,##0',d:'In this report',f:null}];
  prof.forEach((p,ci)=>{if(out.length>=4||!p.numeric||p.main==='pct'||RE_ID.test(p.h))return;const sum=p.cs.reduce((a,c)=>a+(typeof c.v==='number'?c.v:0),0);out.push({l:('TOTAL '+p.h).toUpperCase().replace(/\s*\(INR\)/,''),v:sum,fmt:p.money?'"₹"#,##0':'#,##0',d:'Across all records',col:ci});});
  const st=prof.find((p)=>p.status);
  if(out.length<4&&st){const cnt={};st.cs.forEach((c)=>{if(c.v)cnt[c.v]=(cnt[c.v]||0)+1;});const top=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];if(top)out.push({l:'MOST COMMON '+st.h.toUpperCase(),v:top,d:cnt[top]+' of '+n,txt:1});}
  const fill=[{l:'COLUMNS',v:prof.length,fmt:'0',d:'Fields per record',col:-1},{l:'GENERATED',v:new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),txt:1,d:'Time of export'},{l:'MODULE',v:(s.module||'Admin console'),txt:1,d:'Administrator console'}];let fi=0;
  while(out.length<4&&fi<fill.length)out.push(fill[fi++]);
  return out;
}
function tblXlsx(s){
  const head=s.head,rows=s.rows,n=rows.length,last=n+1;const M=tblMeta(s);const prof=tblProfile(head,rows);
  const bk=new Book({title:s.title,subject:s.subtitle||'',author:'VivoQuest',keywords:(s.module||'')+', report',company:'VivoQuest'});
  const sum=bk.sheet('Summary',{grid:false,tab:C.P,fitH:1});const d=bk.sheet('Data',{tab:'#18845B',freeze:{r:1,c:0},printTitles:1});
  /* data sheet */
  prof.forEach((p,ci)=>{let w=Math.max(String(p.h).length+4,10);p.cs.slice(0,200).forEach((c)=>{w=Math.max(w,Math.min(46,tblShow(c,p).length+3));});d.width(ci+1,Math.min(w,46));
    d.set(1,ci+1,p.h,Object.assign({},HDR,{h:p.numeric?'right':'left',indent:1}));});d.height(1,26);
  rows.forEach((r,i)=>{const rr=i+2;const alt=i%2?{fill:C.ALT}:{};
    prof.forEach((p,ci)=>{const c=p.cs[i];const base=Object.assign({indent:1},alt);
      if(c.v===''||c.v===undefined){d.set(rr,ci+1,'',cell(base));return;}
      if(p.numeric)d.set(rr,ci+1,c.v,cell(Object.assign({h:'right',fmt:tblFmt(p)},base)));
      else if(p.date)d.set(rr,ci+1,c.v,cell(Object.assign({h:'left',fmt:dateFmt},base)));
      else if(p.status)d.set(rr,ci+1,String(c.v),cell(Object.assign({h:'center',b:1},alt)));
      else d.set(rr,ci+1,String(c.v),cell(Object.assign({b:ci===0?1:0,wrap:0},base,ci===0?{}:{})));});
    d.height(rr,21);});
  const hasTot=prof.some((p,ci)=>p.numeric&&p.main!=='pct'&&!RE_ID.test(p.h));let lastRow=last;
  if(hasTot&&n>0){const tr=n+2;const tot={b:1,fill:C.LAV,color:C.INK,bt:['medium',C.P],bb:['thin',C.LINE],v:'center'};let labelled=false;
    prof.forEach((p,ci)=>{const col=colName(ci+1);if(p.numeric&&p.main!=='pct'&&!RE_ID.test(p.h)){const sum2=p.cs.reduce((a,c)=>a+(typeof c.v==='number'?c.v:0),0);d.set(tr,ci+1,{f:'SUM('+col+'2:'+col+last+')',v:sum2},Object.assign({h:'right',fmt:tblFmt(p)},tot));}
      else if(!labelled){d.set(tr,ci+1,'Total',Object.assign({indent:1},tot));labelled=true;}else d.set(tr,ci+1,null,tot);});d.height(tr,24);}
  d.af='A1:'+colName(head.length)+Math.max(last,2);
  prof.forEach((p,ci)=>{if(p.status){const col=colName(ci+1);d.cfStatus(col+'2:'+col+Math.max(last,2),TBL_DXF);}});
  const mc=prof.findIndex((p)=>p.money&&!RE_ID.test(p.h));if(mc>=0&&n>1){const col=colName(mc+1);d.cfBar(col+'2:'+col+last,'#C9B8FA');}
  /* summary sheet */
  for(let c=1;c<=14;c++)sum.width(c,c===1||c===14?2.5:13.6);frame(sum,14);
  titleBlock(sum,M.title,(M.sub?M.sub+' · ':'')+n+' record'+(n===1?'':'s'),2,13,'VIVOQUEST · '+M.module);
  const ks=tblKpis(s,prof,n);
  kpiTiles(sum,7,ks.map((k)=>({l:k.l,v:k.txt?String(k.v):k.v,fmt:k.fmt,d:k.d||' ',tone:'ok'})),2,3);
  ks.forEach((k,i)=>{const c=2+i*3;let v=k.v;
    if(!k.txt&&n>0){if(k.col!==undefined&&k.col>=0){const col=colName(k.col+1);v={f:'SUM(Data!'+col+'2:'+col+last+')',v:k.v};}else if(k.l==='RECORDS'){v={f:'ROWS(Data!A2:A'+Math.max(last,2)+')',v:k.v};}}
    sum.set(8,c,v,{sz:k.txt?16:24,b:1,color:C.INK,fill:C.BG,indent:1,h:'left',v:'center',fmt:k.fmt});});
  sectionHead(sum,12,2,13,'Report details');
  const det=[['Report',M.title],['Module',M.module.charAt(0)+M.module.slice(1).toLowerCase()],['Period or filter',M.sub||'All records'],['Records',n],['Columns',head.length],['Report ID',M.id],['Generated',M.now],['Prepared by',M.who]];
  det.forEach((r,i)=>{const rr=13+i;sum.set(rr,2,r[0],{b:1,sz:10,color:C.MUT,indent:1,v:'center',bb:['thin',C.LINE]});sum.style(rr,2,rr,4,{bb:['thin',C.LINE]});sum.merge(rr,2,rr,4);
    sum.set(rr,5,r[1],{sz:11,color:C.INK,v:'center',h:'left',fmt:r[1] instanceof Date?'dd mmm yyyy':null,bb:['thin',C.LINE]});sum.style(rr,5,rr,13,{bb:['thin',C.LINE]});sum.merge(rr,5,rr,13);sum.height(rr,22);});
  sum.set(23,2,M.foot,{sz:9,color:C.MUT,i:1});sum.merge(23,2,23,13);
  aboutSheet(bk,M.title,[['Summary','Headline figures and report details. Totals are live formulas over the Data sheet.'],['Data','One row per record. Filters are on every column; the header and first column stay in view while you scroll. Status cells are colour coded.'],['Colours','Green means healthy or complete, amber needs attention soon, red needs action now.'],['Source','Generated from the VivoQuest Administrator console. Report ID '+M.id+'.']],C.ACC);
  return bk.build();
}
function tblPdf(s){
  const head=s.head,rows=s.rows;const M=tblMeta(s);const prof=tblProfile(head,rows);const CAP=1500;const shown=rows.slice(0,CAP);
  const SZ=head.length>8?9:10.5;const AV=706;
  const nat=prof.map((p)=>{let w=0;shown.slice(0,80).forEach((r,i)=>{const c=p.cs[i];w=Math.max(w,tw(tblShow(c,p),SZ,p.status||false)+(p.status?34:20));});return w;});
  const mn=prof.map((p,i)=>Math.max(tw(p.h.toUpperCase(),SZ-1.5,true)+18,46));
  let ws=nat.map((w,i)=>Math.max(w,mn[i]));
  if(ws.reduce((a,b)=>a+b,0)>AV){let lo=40,hi=400;for(let k=0;k<30;k++){const cap=(lo+hi)/2;const sm=ws.reduce((a,w,i)=>a+Math.max(Math.min(w,cap),mn[i]),0);if(sm>AV)hi=cap;else lo=cap;}ws=ws.map((w,i)=>Math.max(Math.min(w,lo),mn[i]));
    const sm=ws.reduce((a,b)=>a+b,0);if(sm>AV){const f=AV/sm;ws=ws.map((w)=>w*f);}}
  const tot0=ws.reduce((a,b)=>a+b,0);if(tot0<AV){const grow=(AV-tot0)/ws.length;ws=ws.map((w)=>w+grow);}
  const RH=29,HH=30;const first=s.noKpi?0:112;
  const y0a=96+78+first,y0b=96+8;const cap1=Math.floor((1048-y0a-HH)/RH),cap2=Math.floor((1048-y0b-HH)/RH);
  const chunks=[];let i=0;chunks.push(shown.slice(0,Math.max(cap1,1)));i=chunks[0].length;while(i<shown.length){chunks.push(shown.slice(i,i+cap2));i+=cap2;}
  const doc=new Doc({title:M.title,subject:M.sub,keywords:M.module+', report'});
  const ellip=(str,w,size,b)=>{str=String(str);if(tw(str,size,b)<=w)return str;while(str.length>1&&tw(str+'…',size,b)>w)str=str.slice(0,-1);return str+'...';};
  let ri=0;
  chunks.forEach((ch,pi)=>{
    const g=doc.page();chrome(g,{type:M.module+' REPORT',id:'Report ID '+M.id,sub:M.sub||'All records',foot:M.foot,when:M.now,pageNo:pi+1,pages:chunks.length});
    let y=96;
    if(pi===0){
      g.text(M.module,44,y,{s:10.5,b:1,c:PC.P});g.text(M.title,44,y+16,{s:25,b:1});
      g.text(s.kv?(M.sub||''):(M.sub?M.sub+' · ':'')+rows.length.toLocaleString('en-IN')+' record'+(rows.length===1?'':'s'),44,y+50,{s:11.5,c:PC.MUT});
      y+=82;
      if(!s.noKpi){const ks=tblKpis(s,prof,rows.length);const kw=(706-36)/4;
        ks.forEach((k,ki)=>{let val;if(k.txt)val=String(k.v);else if(k.fmt&&k.fmt.indexOf('₹')>=0)val='₹'+Math.round(k.v).toLocaleString('en-IN');else if(typeof k.v==='number')val=k.v.toLocaleString('en-IN',{maximumFractionDigits:2});else val=String(k.v);
          const x=44+ki*(kw+12);g.inset(x,y,kw,92,PC.LINE,14);g.text(k.l,x+14,y+13,{s:9.5,b:1,c:PC.MUT});g.text(ellip(val,kw-28,k.txt?15:22,true),x+14,y+31,{s:k.txt?15:22,b:1});if(k.d)g.text(k.d,x+14,y+68,{s:10,b:1,c:'#0F6B47'});});
        y+=108;}
      doc.bookmark('Data',g,y);
    }else y=y0b;
    /* header row */
    g.rect(44,y,AV,HH-2,{fill:PC.LAV,r:8});let cx=44;
    prof.forEach((p,ci)=>{const w=ws[ci];const t=ellip(p.h.toUpperCase(),w-14,SZ-1.5,true);if(p.numeric)g.text(t,cx+w-8,y+9,{s:SZ-1.5,b:1,c:PC.P,a:'r'});else g.text(t,cx+8,y+9,{s:SZ-1.5,b:1,c:PC.P});cx+=w;});
    y+=HH;
    ch.forEach((r,k)=>{const ry=y+k*RH;if(k%2)g.rect(44,ry,AV,RH,{fill:'#FAF9FE'});g.line(44,ry+RH,44+AV,ry+RH,{c:PC.L2,w:1});let x=44;
      prof.forEach((p,ci)=>{const w=ws[ci];const c=p.cs[ri+k]||{v:''};const txt=tblShow(c,p);
        if(txt!==''){if(p.status){const tn=TONE[tblTone(txt)==='def'?'neu':tblTone(txt)];const t2=ellip(txt,w-24,SZ-0.5,true);const cw2=tw(t2,SZ-0.5,true)+16;g.rect(x+8,ry+(RH-19)/2,cw2,19,{fill:tn[0],r:9.5});g.text(t2,x+16,ry+(RH-14)/2+0.5,{s:SZ-0.5,b:1,c:tn[1]});}
          else if(p.numeric)g.text(ellip(txt,w-12,SZ,false),x+w-8,ry+(RH-SZ-2)/2,{s:SZ,a:'r'});
          else g.text(ellip(txt,w-14,SZ,ci===0),x+8,ry+(RH-SZ-2)/2,{s:SZ,b:ci===0});}
        x+=w;});});
    ri+=ch.length;
    if(pi===chunks.length-1&&rows.length>CAP)g.text('Showing the first '+CAP.toLocaleString('en-IN')+' of '+rows.length.toLocaleString('en-IN')+' records. Download the Excel report for the full set.',44,y+ch.length*RH+12,{s:10.5,b:1,c:PC.MUT});
    else if(pi===chunks.length-1&&rows.length===0)g.text('No records match the current filters.',44,y+14,{s:12,c:PC.MUT});
  });
  return doc.build();
}

return {tblX:tblXlsx,tblP:tblPdf,payX:paymentsWorkbook,outX:outcomesWorkbook,care:carePdf,dis:dischargePdf,out:outcomesPdf,inv:invoicePdf};
});

/*!
 * VivoQuest report downloads: UI glue (v1.0.0)
 * Needs vq-engine.js loaded first.
 *
 * Markup:   <button data-vq-report="outcomes" data-vq-format="xlsx" data-vq-period="30d">Download Excel</button>
 * Script:   VQReports.download('outcomes', 'pdf', { period:'Quarter 4 2026' })
 *           VQReports.build('payments', 'xlsx', data)  -> Promise<Uint8Array>
 *
 * Report types and formats:
 *   patient-care  pdf          discharge  pdf          invoice  pdf
 *   outcomes      pdf | xlsx   payments   xlsx
 */
(function (root) {
  'use strict';
  var E = root.VQEngine;
  var CFG = root.VQReportsConfig || {};            // { dataUrl, headers, credentials, sampleBase }
  var DATE_KEYS = { date: 1, settled: 1, expected: 1 };

  var REPORTS = {
    'patient-care': { pdf: function (d) { return E.care(d); }, slug: 'Care-Summary', periodic: true },
    'discharge':    { pdf: function (d) { return E.dis(d); }, slug: 'Discharge-Summary' },
    'invoice':      { pdf: function (d) { return E.inv(d); }, slug: 'Invoice' },
    'outcomes':     { pdf: function (d) { return E.out(d); }, xlsx: function (d) { return E.outX(d); }, slug: 'Outcomes-Report', periodic: true },
    'payments':     { xlsx: function (d) { return E.payX(d); }, slug: 'Payments', periodic: true }
  };
  var MIME = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };

  /* JSON carries dates as ISO strings; the engine wants Date objects. */
  function revive(node) {
    if (Array.isArray(node)) return node.map(revive);
    if (node && typeof node === 'object') {
      var o = {};
      Object.keys(node).forEach(function (k) {
        var v = node[k];
        o[k] = (DATE_KEYS[k] && typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) ? new Date(v) : revive(v);
      });
      return o;
    }
    return node;
  }

  function slugPeriod(p) { return String(p || '').trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function fileName(type, fmt, data, opts) {
    var r = REPORTS[type];
    var mid = (r.periodic && type !== 'invoice') ? '_' + (slugPeriod(opts && opts.periodSlug) || slugPeriod(data && data.period) || 'Report') : '';
    if (type === 'invoice' && data && data.id) mid = '_' + slugPeriod(data.id);
    return 'VivoQuest_' + r.slug + mid + '.' + fmt;
  }

  /* Data source. Configure once before this script loads:
       window.VQReportsConfig = { dataUrl: '/api/reports/data', headers: () => ({ Authorization: 'Bearer ' + token }), credentials: 'include' }
     GET <dataUrl>?type=<type>&period=<p>&id=<id> must return the JSON for that report (see sample-data/).
     Without dataUrl, the bundled sample JSON in sampleBase is used (demo mode). */
  function loadData(type, opts) {
    opts = opts || {};
    if (opts.data) return Promise.resolve(revive(opts.data));
    var url = CFG.dataUrl;
    if (url) {
      var q = (url.indexOf('?') < 0 ? '?' : '&') + 'type=' + encodeURIComponent(type) + (opts.period ? '&period=' + encodeURIComponent(opts.period) : '') + (opts.id ? '&id=' + encodeURIComponent(opts.id) : '');
      var h = typeof CFG.headers === 'function' ? CFG.headers() : (CFG.headers || {});
      return fetch(url + q, { credentials: CFG.credentials || 'same-origin', headers: h })
        .then(function (r) { if (!r.ok) throw new Error('Report data request failed (' + r.status + ')'); return r.json(); })
        .then(revive);
    }
    if (CFG.sampleBase) {
      return fetch(CFG.sampleBase + type + '.json').then(function (r) { return r.json(); }).then(revive);
    }
    return Promise.reject(new Error('No data source configured'));
  }

  function build(type, fmt, data) {
    var r = REPORTS[type];
    if (!r || !r[fmt]) return Promise.reject(new Error('Unsupported report: ' + type + ' / ' + fmt));
    return new Promise(function (ok, fail) {
      setTimeout(function () { try { ok(r[fmt](revive(data))); } catch (e) { fail(e); } }, 0);   // let the UI paint a spinner first
    });
  }

  function save(bytes, name, fmt) {
    var url = URL.createObjectURL(new Blob([bytes], { type: MIME[fmt] }));
    var a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function download(type, fmt, opts) {
    opts = opts || {};
    return loadData(type, opts).then(function (data) {
      return build(type, fmt, data).then(function (bytes) {
        var name = opts.filename || fileName(type, fmt, data, opts);
        save(bytes, name, fmt);
        return { filename: name, size: bytes.length };
      });
    });
  }

  /* Wire up buttons: <button data-vq-report data-vq-format [data-vq-period] [data-vq-id]> */
  function toast(msg, bad) {
    var t = document.createElement('div');
    t.className = 'vq-toast' + (bad ? ' vq-toast--bad' : ''); t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200);
  }
  function attach(scope) {
    (scope || document).querySelectorAll('[data-vq-report]:not([data-vq-bound])').forEach(function (btn) {
      btn.setAttribute('data-vq-bound', '1');
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (btn.disabled) return;
        var label = btn.innerHTML;
        btn.disabled = true; btn.classList.add('vq-busy'); btn.setAttribute('aria-busy', 'true');
        download(btn.getAttribute('data-vq-report'), btn.getAttribute('data-vq-format') || 'pdf', {
          period: btn.getAttribute('data-vq-period') || undefined,
          periodSlug: btn.getAttribute('data-vq-period-label') || undefined,
          id: btn.getAttribute('data-vq-id') || undefined
        }).then(function (r) { toast('Downloaded ' + r.filename); })
          .catch(function (e) { toast(e && e.message ? e.message : 'Could not create the report', true); })
          .then(function () { btn.disabled = false; btn.classList.remove('vq-busy'); btn.removeAttribute('aria-busy'); btn.innerHTML = label; });
      });
    });
  }

  root.VQReports = { download: download, build: build, attach: attach, fileName: fileName, types: REPORTS };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { attach(); }); else attach();
})(window);


(function(w){var DATA={"patient-care":{"id":"VQ-CS-[000000]","period":"[DD Mon YYYY] to [DD Mon YYYY]","initials":"PN","name":"[Patient name]","line":"[Age] years \u00b7 [Sex] \u00b7 MRN [MRN] \u00b7 Primary condition: [Condition]","nurse":"[Nurse name]","clinician":"[Clinician name]","kpis":[["Medicine adherence","92%","On track","ok"],["Average blood pressure","128/82","Watch","warn"],["Oxygen saturation","97%","Normal range","ok"],["Pain score","2 / 10","Improving","ok"]],"sys":[124,129,122,131,126,134,130],"dia":[80,84,79,86,81,85,79],"meds":[{"name":"[Medicine 1]","dose":"[Dose]","when":"Morning","pct":96,"status":"On track","tone":"ok"},{"name":"[Medicine 2]","dose":"[Dose]","when":"Morning, night","pct":88,"status":"1 missed dose","tone":"warn"},{"name":"[Medicine 3]","dose":"[Dose]","when":"Night","pct":100,"status":"On track","tone":"ok"}],"goals":[["Walk 20 minutes a day",70],["Low-salt meals, 6 of 7 days",85],["Record vitals twice a day",100]],"visits":[["[Date]","Nurse wellness visit"],["[Date]","Physiotherapy visit"],["[Date]","Clinician video review"]],"note":"[Nurse note: one short paragraph on how the week went, what changed, and what the family should watch for.]"},"discharge":{"id":"VQ-DS-[000000]","name":"[Patient name]","line":"[Age] years \u00b7 [Sex] \u00b7 MRN [MRN]","caregiver":"[Caregiver name], [Phone]","admitted":"[DD Mon YYYY]","discharged":"[DD Mon YYYY]","course":"Primary diagnosis: [Primary diagnosis]. [Two or three sentences from the clinician on what happened, what treatment was given, and how the patient is doing at discharge.]","checklist":[["Medicines reconciled by a pharmacist",1],["Caregiver trained on daily care",1],["Home safety review booked",1],["Equipment ordered and approved",1],["Follow-up appointments scheduled",1],["Transport home confirmed",0]],"timeline":[["Day of discharge","Nurse call and first vitals check"],["Day 2","Nurse home visit"],["Day 7","Clinician video review"],["Day 14","Physiotherapy visit"],["Day 30","Outcome check and care plan update"]],"changes":[["[Medicine 1]","[Dose], morning","New","ok","[Reason]"],["[Medicine 2]","[Dose], morning and night","Dose changed","warn","[Reason]"],["[Medicine 3]","Stopped","Stopped","bad","[Reason]"]],"equipment":["Digital BP monitor \u00b7 Delivered","Low-sodium meal kit, 7 days \u00b7 Ordered","Weekly pill organiser \u00b7 Ordered"],"warn":["[Warning sign 1]","[Warning sign 2]","[Warning sign 3]","Care desk: [Phone number], 24 hours"]},"invoice":{"id":"VQ-INV-[000000]","order":"VQ-[000000]","date":"[DD Mon YYYY]","seller":["[Legal entity name]","[Registered address]","GSTIN [GSTIN] \u00b7 PAN [PAN]"],"buyer":["[Customer name]","[Billing address]","[Email] \u00b7 [Phone]"],"items":[{"name":"Digital BP monitor","type":"Shipped","qty":1,"unit":1899},{"name":"Low-sodium meal kit, 7 days","type":"Shipped","qty":1,"unit":1499},{"name":"Nurse wellness visit","type":"Booked visit","qty":1,"unit":799}],"couponPct":10,"coupon":"VIVO10","shipping":0,"pay":[["Gateway","Razorpay"],["Method","UPI"],["Payment ID","pay_[14 characters]"],["Gateway order ID","order_[14 characters]"],["Paid on","[DD Mon YYYY, hh:mm]"],["Verification","Signature verified",1]],"next":"Equipment is approved by a nurse before dispatch. Your visit is booked for [Day, time slot]. Track every order in Orders and payments inside VivoQuest."},"outcomes":{"period":"Quarter [Q] [YYYY]","plan":"[Plan or ACO name]","by":"[User]","target":10,"fac":[{"name":"Facility A","n":412,"readmit":6,"adh":96,"chk":88,"csat":4.8},{"name":"Facility B","n":268,"readmit":7.6,"adh":93,"chk":87,"csat":4.7},{"name":"Facility C","n":305,"readmit":10.4,"adh":89,"chk":85,"csat":4.5},{"name":"Facility D","n":190,"readmit":11.6,"adh":82,"chk":83,"csat":4.3}],"mon":[{"m":"Month 1","readmit":11.4,"chk":80},{"m":"Month 2","readmit":10.2,"chk":82},{"m":"Month 3","readmit":8.8,"chk":83},{"m":"Month 4","readmit":9.3,"chk":84},{"m":"Month 5","readmit":7.9,"chk":85},{"m":"Month 6","readmit":7.2,"chk":86}],"id":"VQ-OR-[000000]","headline":"Fewer returns to hospital, steadier recovery at home","summary":"[Two sentences summarising the quarter for [Plan or ACO name]: the headline result, the main driver, and the one action recommended for next quarter.]","worked":"[Insight 1: the practice or programme most linked to the improvement.]","attention":"[Insight 2: the facility or group behind the gap and the suggested fix.]","method":"[Describe cohort, data sources, period and how rates are calculated.]"},"payments":{"period":"1 to 31 Oct 2026","by":"[User]","tx":[{"date":"2026-09-30T18:30:00.000Z","order":"VQ-100412","gw":"Razorpay","method":"UPI","payId":"pay_Qx7\u2026k2m","cur":"INR","amt":1899,"inr":1899,"status":"Captured","settled":"2026-10-02T18:30:00.000Z"},{"date":"2026-10-01T18:30:00.000Z","order":"VQ-100418","gw":"Razorpay","method":"Card","payId":"pay_Rm2\u2026p9a","cur":"INR","amt":1499,"inr":1499,"status":"Captured","settled":"2026-10-03T18:30:00.000Z"},{"date":"2026-10-02T18:30:00.000Z","order":"VQ-100425","gw":"Stripe","method":"Card","payId":"pi_3Pq\u202681x","cur":"USD","amt":89.99,"inr":7499,"status":"Captured","settled":"2026-10-05T18:30:00.000Z"},{"date":"2026-10-03T18:30:00.000Z","order":"VQ-100431","gw":"Razorpay","method":"Netbanking","payId":"pay_Tn5\u2026c1d","cur":"INR","amt":2499,"inr":2499,"status":"Failed","settled":null},{"date":"2026-10-04T18:30:00.000Z","order":"VQ-100437","gw":"Razorpay","method":"UPI","payId":"pay_Uv8\u2026q4e","cur":"INR","amt":799,"inr":799,"status":"Captured","settled":"2026-10-06T18:30:00.000Z"},{"date":"2026-10-06T18:30:00.000Z","order":"VQ-100446","gw":"Stripe","method":"Apple Pay","payId":"pi_3Qa\u202677z","cur":"USD","amt":34.5,"inr":2875,"status":"Captured","settled":"2026-10-09T18:30:00.000Z"},{"date":"2026-10-07T18:30:00.000Z","order":"VQ-100452","gw":"Razorpay","method":"Wallet","payId":"pay_Wz1\u2026h6f","cur":"INR","amt":349,"inr":349,"status":"Captured","settled":"2026-10-09T18:30:00.000Z"},{"date":"2026-10-08T18:30:00.000Z","order":"VQ-100459","gw":"Razorpay","method":"Card","payId":"pay_Xa4\u2026j3g","cur":"INR","amt":7999,"inr":7999,"status":"Refunded","settled":"2026-10-11T18:30:00.000Z"},{"date":"2026-10-10T18:30:00.000Z","order":"VQ-100463","gw":"Stripe","method":"Card","payId":"pi_3Rb\u202602y","cur":"USD","amt":149,"inr":12417,"status":"Captured","settled":"2026-10-13T18:30:00.000Z"},{"date":"2026-10-11T18:30:00.000Z","order":"VQ-100470","gw":"Razorpay","method":"UPI","payId":"pay_Yb6\u2026m8h","cur":"INR","amt":1299,"inr":1299,"status":"Pending","settled":null},{"date":"2026-10-13T18:30:00.000Z","order":"VQ-100478","gw":"Razorpay","method":"UPI AutoPay","payId":"pay_Zc9\u2026n2i","cur":"INR","amt":7999,"inr":7999,"status":"Captured","settled":"2026-10-15T18:30:00.000Z"},{"date":"2026-10-14T18:30:00.000Z","order":"VQ-100481","gw":"Stripe","method":"Card","payId":"pi_3Sc\u202619w","cur":"USD","amt":12,"inr":1000,"status":"Failed","settled":null}],"rf":[{"date":"2026-10-11T18:30:00.000Z","order":"VQ-100459","gw":"Razorpay","id":"rfnd_Ab3\u2026q7s","amt":7999,"reason":"Customer request","status":"Processed","expected":"2026-10-16T18:30:00.000Z"}]}};
w.VQApp={dl:function(type,fmt,o){o=o||{};var d=JSON.parse(JSON.stringify(DATA[type]));if(o.patch)o.patch(d);
 return w.VQReports.download(type,fmt,{data:d,periodSlug:o.periodSlug,filename:o.filename});},
 run:function(say,type,fmt,o){say&&say('Preparing your '+(fmt==='xlsx'?'Excel':'PDF')+' report…');
  return w.VQApp.dl(type,fmt,o).then(function(r){say&&say(r.filename+' downloaded');},function(e){say&&say('Could not create the report: '+(e&&e.message||e));});}};})(window);

(function(w){var A=w.VQApp,E=w.VQEngine;
function bytesSave(bytes,name,mime){var u=URL.createObjectURL(new Blob([bytes],{type:mime}));var a=document.createElement('a');a.href=u;a.download=name;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},4000);}
function modFor(n){n=String(n).toLowerCase();if(/transaction|settle|refund|reconcil|invoice|finance|gst|receivable|payment|collection/.test(n))return 'Payments';if(/compliance|audit|control|filing|statutory|auditor|approval/.test(n))return 'Compliance';if(/user|member|access|engagement/.test(n))return 'Users';if(/product|order|vendor|marketplace/.test(n))return 'Marketplace';if(/privacy|security/.test(n))return 'Security';return 'Admin';}
var PER=/\s(Last \d+ days|Today|This week|This month|Last quarter|FY [\d–-]+)$/;
function cap(x){x=String(x).trim();return x.charAt(0).toUpperCase()+x.slice(1);}
A.today=function(){var D=new Date(),M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return D.getDate()+' '+M[D.getMonth()]+' '+D.getFullYear();};
A.spec=function(name,head,data,title,o){o=o||{};var raw=String(title||name).replace(/^VivoQuest\s+/i,'');var parts=raw.split(/\s[|·]\s/);var main=parts[0],sub=parts.slice(1).join(' · ');var m=PER.exec(main);if(m&&!sub){sub=m[1];main=main.replace(PER,'');}
 return {title:o.title||cap(main),subtitle:o.subtitle||sub,module:o.module||modFor(name+' '+raw),head:head,rows:data,kpis:o.kpis,by:'Administrator console',noKpi:o.noKpi,kv:o.kv};};
A.tbl=function(fmt,name,head,data,title,o){var sp=A.spec(name,head,data,title,o);
 if(fmt==='PDF'){bytesSave(E.tblP(sp),name+'.pdf','application/pdf');return name+'.pdf';}
 bytesSave(E.tblX(sp),name+'.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');return name+'.xlsx';};
A.csv=function(name,head,data){var esc=function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';};bytesSave('﻿'+[head].concat(data).map(function(r){return r.map(esc).join(',');}).join('\r\n'),name+'.csv','text/csv;charset=utf-8');return name+'.csv';};
A.tblRun=function(say,fmt,title,head,data,o){o=o||{};try{
  if(o.kpiRows)o.kpis=data.slice(0,4).map(function(r){return {l:String(r[0]).toUpperCase(),v:String(r[1]),txt:1,d:String(r[2]||'')};});
  var nm='VivoQuest '+title.charAt(0).toLowerCase()+title.slice(1)+(o.subtitle?' '+o.subtitle:'');nm=nm.replace(/[\\/:*?"<>|]+/g,'-');
  var fn=fmt==='CSV'?A.csv(nm,head,data):A.tbl(fmt,nm,head,data,title+(o.subtitle?' | '+o.subtitle:''),o);
  say&&say(fn+' downloaded · '+data.length+' rows');}catch(e){say&&say('Could not create the report: '+(e&&e.message||e));}};
A.inv=function(say,x){x.date=A.today();return A.run(say,'invoice','pdf',{patch:function(d){Object.keys(x).forEach(function(k){d[k]=x[k];});}});};
})(window);
