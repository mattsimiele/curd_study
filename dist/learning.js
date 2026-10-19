// Pure learning rules shared by the app and regression tests.
export const kind = q => q[4] || 'choice';
export function isCorrect(q, selected) {
  if (kind(q) === 'choice') return selected === q[2];
  if (!Array.isArray(selected) || selected.length !== q[2].length) return false;
  return kind(q) === 'order' ? selected.every((v,i)=>v===q[2][i]) : q[2].every(v=>selected.includes(v));
}
export function canCheck(q, selected) {
  return kind(q) === 'choice' ? Number.isInteger(selected) : kind(q) === 'order' ? selected.length===q[1].length : selected.length>0;
}
export function createSession(questions, extra={}) {
  return {questions:[...questions],total:questions.length,step:0,selected:null,checked:false,correct:0,combo:0,bestCombo:0,resolved:[],phase:'quiz',...extra};
}
export function checkAttempt(s) {
  const current=s.questions[s.step];
  const right=isCorrect(current.data,s.selected);
  s.right=right;s.checked=true;
  if(right){
    if(!current.retry)s.correct++;
    s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);
    if(!s.resolved.includes(current.key))s.resolved.push(current.key);
  }else{
    s.combo=0;
    s.questions.push({...current,retry:true});
  }
  return right;
}
export function advance(s) {
  s.step++;s.selected=null;s.checked=false;
  return s.step===s.questions.length;
}
export function migrate(saved, modules) {
  const defaults={done:[],xp:0,days:[],notes:[],missed:[],best:{},lastLesson:null};
  if(!saved||typeof saved!=='object')return defaults;
  const validLesson=k=>typeof k==='string'&&/^\d+-\d+$/.test(k)&&!!modules[k.split('-')[0]]?.lessons[k.split('-')[1]];
  const validQuestion=k=>typeof k==='string'&&/^\d+-\d+-\d+$/.test(k)&&!!modules[k.split('-')[0]]?.lessons[k.split('-')[1]]?.questions[k.split('-')[2]];
  return {...defaults,done:[...new Set((Array.isArray(saved.done)?saved.done:[]).filter(validLesson))],xp:Number.isFinite(saved.xp)?Math.max(0,saved.xp):0,days:[...new Set((Array.isArray(saved.days)?saved.days:[]).filter(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)))],notes:Array.isArray(saved.notes)?saved.notes.filter(n=>n&&typeof n==='object'):[],missed:[...new Set((Array.isArray(saved.missed)?saved.missed:[]).filter(validQuestion))],best:saved.best&&typeof saved.best==='object'&&!Array.isArray(saved.best)?saved.best:{},lastLesson:validLesson(saved.lastLesson)?saved.lastLesson:null};
}
export function nextLesson(modules,done) {
  for(let m=0;m<modules.length;m++)for(let l=0;l<modules[m].lessons.length;l++)if(!done.includes(`${m}-${l}`))return `${m}-${l}`;
  return null;
}
