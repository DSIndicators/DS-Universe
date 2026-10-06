/**
 * THE TRANSLATED-PAGE GUARD (2026-10-06).
 *
 * Tom translated the home page to Korean in Chrome, pointed at a row of the
 * DS Complete list, and the whole site went to a blank screen: "Application
 * error: a client-side exception has occurred". The exception was
 *   Failed to execute 'removeChild' on 'Node': The node to be removed is not
 *   a child of this node.
 *
 * WHY. A page translator (Chrome's, Edge's, the Google Translate bar) does
 * not edit text in place: it takes each text node OUT of the page and puts
 * <font><font>translated</font></font> where it was. React still holds the
 * node it wrote. The next time React removes that node, or inserts something
 * in front of it — any line that swaps one piece of text for another, which is
 * what the DS Complete caption does on every hover — the browser throws,
 * React unmounts the whole tree, and Next shows its error screen. Any browser
 * extension that rewrites text does the same.
 *
 * WHAT THIS DOES, before React starts (an inline script in <head>):
 *  1. It watches the page and remembers which <font> a translator put in place
 *     of which text node.
 *  2. removeChild / insertBefore on a node that is no longer there act on its
 *     stand-in instead — the translated text goes, the new text arrives in the
 *     right place — and never throw. With no stand-in on record, a removal is
 *     a no-op and an insertion goes to the end of its parent.
 *  3. When React rewrites a text node the translator took out, the node goes
 *     back where its stand-in is, with the new words (the translator then
 *     translates it again, as it does for any new text).
 * On a page nobody has translated, none of these branches is ever taken.
 *
 * `window.__dsDomGuard.hits` counts how often a branch WAS taken — the
 * translated-page sweep reads it.
 */
const GUARD = `(function(){
if(typeof Node!=='function'||!Node.prototype||window.__dsDomGuard)return;
var G=window.__dsDomGuard={hits:0};
var map=typeof WeakMap==='function'?new WeakMap():null;
var rm=Node.prototype.removeChild,ins=Node.prototype.insertBefore,rep=Node.prototype.replaceChild;
function standIn(n,parent){var r=map&&n?map.get(n):null;return r&&r.parentNode===parent?r:null}
Node.prototype.removeChild=function(c){
if(c&&c.parentNode!==this){G.hits++;var r=standIn(c,this);if(r){map.delete(c);rm.call(this,r)}return c}
return rm.apply(this,arguments)};
Node.prototype.insertBefore=function(n,ref){
if(ref&&ref.parentNode!==this){G.hits++;return ins.call(this,n,standIn(ref,this))}
return ins.apply(this,arguments)};
try{
var d=Object.getOwnPropertyDescriptor(Node.prototype,'nodeValue');
if(map&&d&&d.get&&d.set&&typeof Text==='function')Object.defineProperty(Text.prototype,'nodeValue',{configurable:true,enumerable:d.enumerable,
get:function(){return d.get.call(this)},
set:function(v){d.set.call(this,v);if(!this.parentNode){var r=map.get(this);if(r&&r.parentNode){G.hits++;map.delete(this);rep.call(r.parentNode,this,r)}}}});
}catch(e){}
if(map&&typeof MutationObserver==='function')new MutationObserver(function(recs){
for(var i=0;i<recs.length;i++){var m=recs[i],out=m.removedNodes;if(!out.length)continue;
var f=null,a=m.addedNodes,j;for(j=0;j<a.length;j++)if(a[j].nodeName==='FONT'){f=a[j];break}
if(!f){var p=m.previousSibling,n=m.nextSibling;f=p&&p.nodeName==='FONT'?p:n&&n.nodeName==='FONT'?n:null}
if(!f)continue;for(j=0;j<out.length;j++)if(out[j].nodeType===3)map.set(out[j],f)}
}).observe(document.documentElement,{childList:true,subtree:true});
})();`;

export function DomGuard() {
  return <script dangerouslySetInnerHTML={{ __html: GUARD }} />;
}
