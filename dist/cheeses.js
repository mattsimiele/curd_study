import {cheeses} from './cheese-data.js';
export {cheeses};
export const families={washed:'Washed rinds',alpine:'Mountain & semi-hard',softsheep:'Soft sheep cheeses',goat:'Goat & surface-ripened',blue:'Blue cheeses',bloomy:'Bloomy rinds',fresh:'Fresh, stretched & processed',territorial:'Territorial cheeses',hard:'Hard cheeses'};
export const cheeseSources=Object.fromEntries(cheeses.map(c=>['cheese-'+c.id,{title:c.name+' · reference',url:c.source,detail:'Identification reference. Styles, producers and maturity can vary; sensory clues are typical, not guarantees.'}]));
const byId=id=>cheeses.find(c=>c.id===id);
const refs=cs=>cs.map(c=>({source:'cheese-'+c.id,pages:'Milk, origin, rind and identification clues'}));
const preferred={comte:'gruyere',gruyere:'emmentaler',emmentaler:'jarlsberg',roquefort:'stilton',stilton:'gorgonzola',gorgonzola:'roquefort','humboldt-fog':'morbier',morbier:'humboldt-fog',winnimere:'harbison',harbison:'winnimere',parmigiano:'grana-padano','grana-padano':'parmigiano',cheddar:'colby',colby:'cheddar','brie-meaux':'camembert-normandie','camembert-normandie':'brie-meaux',epoisses:'langres',langres:'epoisses',paneer:'halloumi',halloumi:'paneer',cabrales:'valdeon',valdeon:'cabrales'};
const peers=c=>[...(preferred[c.id]?[byId(preferred[c.id])]:[]),...cheeses.filter(x=>x.family===c.family&&x.id!==c.id),...cheeses.filter(x=>x.family!==c.family)].filter((x,i,a)=>x.id!==c.id&&a.indexOf(x)===i);
const identity=c=>`${c.milk} milk · ${c.origin}`;
const question=(prompt,options,answer,explanation,why,type='choice')=>[prompt,options,answer,explanation,type,{why}];
export const cheeseLessons=cheeses.map(c=>{
 const others=peers(c),p=others[0],choices=[c,...others.slice(0,3)];
 const identities=[...new Set([identity(c),...others.map(identity)])].slice(0,4);
 const sections=[{title:'Build an identity',body:`${c.name}: ${identity(c)}. Rind: ${c.rind}. Texture: ${c.texture}. ${c.signature}.`},{title:'Connect the make to the cheese',body:`${c.make} ${c.nuance}`},{title:`Tell it apart from ${p.name}`,body:`${c.name}: ${c.signature}. ${p.name}: ${p.signature}. Compare milk and origin too: ${identity(c)} versus ${identity(p)}. Use a cluster of clues rather than one flavour word.`}];
 return {title:c.name,level:'cheese',cheeseId:c.id,sections,read:sections.map(s=>s.body).join('\n\n'),objectives:['Recognise the cheese from several identifying clues.',`Distinguish it from ${p.name}.`],references:refs(choices),questions:[
 question(`Which cheese fits this description? ${c.signature}.`,choices.map(x=>x.name),0,`${c.name}: ${identity(c)}; ${c.rind} rind; ${c.texture}.`,choices.slice(1).map(x=>`${x.name}: ${x.signature}.`).join(' ')),
 question(`Which milk and origin combination belongs to ${c.name}?`,identities,0,`${c.name} is associated with ${identity(c)}. ${c.nuance}`,'The other combinations describe different cheese identities; similar rinds do not imply identical milk or origin.'),
 question(`You are comparing ${c.name} with ${p.name}. Which clue describes ${p.name}?`,choices.map(x=>x.signature),1,`${p.name}: ${p.signature}. ${c.name}: ${c.signature}.`,'A shared family or texture is not enough. Match the more specific geographical, rind or production clue.'),
 question(`Select the two correct identity matches.`,[`${c.name} → ${c.signature}`,`${p.name} → ${p.signature}`,`${c.name} → ${p.signature}`,`${p.name} → ${c.signature}`],[0,1],`${c.name}: ${c.signature}. ${p.name}: ${p.signature}.`,'The other two statements swap the cheeses’ identifying clues.','multi')
 ]};
});
const flightDefs=[
 ['Alpine look-alikes','comte','gruyere','emmentaler'],
 ['Grating cheeses','parmigiano','grana-padano','pecorino-toscano'],
 ['Three classic blues','roquefort','stilton','gorgonzola'],
 ['Blue cheeses and their wrappers','cabrales','valdeon','rogue-river'],
 ['Ash is not blue mould','humboldt-fog','morbier','valencay'],
 ['Recognise the goat-cheese shape','sainte-maure','selles-cher','chabichou'],
 ['Washed-rind identities','epoisses','langres','taleggio'],
 ['Beyond a white rind','brie-meaux','camembert-normandie','brillat-savarin'],
 ['Soft sheep cheeses','azeitao','serra-estrela','la-serena'],
 ['Cheeses in the kitchen','halloumi','paneer','burrata'],
 ['American soft-ripened cheeses','winnimere','harbison','red-hawk'],
 ['Firm does not mean Cheddar','cheddar','colby','gloucester']
];
export const flights=flightDefs.map(([title,...ids],i)=>({id:'flight-'+i,title,cheeses:ids.map(byId)}));
export const comparisonLessons=flights.map(f=>{
 const sections=f.cheeses.map(c=>({title:c.name,body:`${identity(c)}. Rind: ${c.rind}. Texture: ${c.texture}. ${c.signature}. ${c.make} ${c.nuance}`}));
 return {title:f.title,level:'cheese',flightId:f.id,sections,read:sections.map(s=>s.title+': '+s.body).join('\n\n'),objectives:['Contrast three similar cheeses using multiple clues.','Recall the identity without relying on a flavour word alone.'],references:refs(f.cheeses),questions:f.cheeses.flatMap((c,i)=>[
 question(`Which cheese fits? ${c.signature}.`,f.cheeses.map(x=>x.name),i,`${c.name}: ${c.signature}.`,f.cheeses.filter(x=>x!==c).map(x=>`${x.name}: ${x.signature}.`).join(' ')),
 question(`Choose the distinguishing clue for ${c.name}.`,f.cheeses.map(x=>x.signature),i,`${identity(c)}. ${c.make}`,f.cheeses.filter(x=>x!==c).map(x=>`${x.name}: ${x.signature}.`).join(' '))
 ])};
});
export const normalise=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function findCheeses(query='',family=''){const q=normalise(query.trim());return cheeses.filter(c=>(!family||c.family===family)&&normalise([c.name,c.milk,c.origin,c.rind,c.signature].join(' ')).includes(q));}
