
const supabaseClient = window.supabase?.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

if (!supabaseClient) {
  console.error(
    "Supabase कनेक्शन नहीं बना। URL, publishable key और स्क्रिप्ट जाँचें।"
  );
}

const supabaseClient = window.supabase?.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

if (!supabaseClient) {
  console.error(
    "Supabase कनेक्शन नहीं बना। URL, publishable key और स्क्रिप्ट जाँचें।"
  );
}
const supabaseClient = window.supabase?.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);
const CATEGORIES = ["रोमांटिक","कॉमेडी","हास्य-व्यंग्य","प्रेम","सस्पेंस एवं थ्रिलर","एडवेंचर","साइंस फिक्शन","फैंटेसी","देशप्रेम","शौर्य","ओज","ऐतिहासिक","पौराणिक","मिश्रित","रेखाचित्र","बालकथा","मनोरंजन","शिक्षाप्रद","अन्य"];
const SUBTYPES = {
  "गद्य":["कहानी","लघुकथा","उपन्यास","लेख","निबंध","नाटक","संस्मरण","यात्रा वृत्तांत","आत्मकथा","हास्य-व्यंग्य","जीवनी"],
  "पद्य":["कविता","गीत","मुक्तक","छंद","नई कविता"],
  "चंपू काव्य":[]
};
const STORAGE = "sahityaGram.v1";
const seed = [
  {id:"sample1",title:"पीपल के नीचे",type:"गद्य",subtype:"कहानी",categories:["प्रेम","मिश्रित"],author:"साहित्य ग्राम",body:"गाँव के पुराने पीपल के नीचे एक छोटी-सी चौपाल थी। शाम ढलती तो पत्तों के बीच से आती हवा जाने कितनी कहानियाँ सुनाती।\n\nउस दिन भी कोई वहाँ आया था—अपने मन में एक अधूरा पत्र और आँखों में एक पूरा संसार लिए।",created:Date.now()-300000,reads:18,minutes:1},
  {id:"sample2",title:"शब्दों का घर",type:"पद्य",subtype:"कविता",categories:["मनोरंजन","प्रेम"],author:"साहित्य ग्राम",body:"कुछ शब्द दीपक बन जाते हैं,\nकुछ राहों में फूल बिछाते हैं।\nजो मन से मन तक पहुँच सकें,\nवे ही अपना घर बनाते हैं।",created:Date.now()-200000,reads:12,minutes:1},
  {id:"sample3",title:"एक नया सवेरा",type:"गद्य",subtype:"लघुकथा",categories:["शिक्षाप्रद","मिश्रित"],author:"साहित्य ग्राम",body:"पहली किरण खिड़की पर आई तो उसने पुरानी डायरी खोली। कल की असफलताओं के बीच आज के लिए एक खाली पन्ना बचा था। उसने मुस्कराकर लिखा—शुरुआत।",created:Date.now()-100000,reads:9,minutes:1}
];
let state = loadState();
let activeCategory = "सभी";
let activeTab = "home";
let currentReaderId = null;
let readingStartedAt = 0;
let toastTimer;

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    if(saved) return {...saved, stories: Array.isArray(saved.stories) ? saved.stories : seed};
  }catch(e){}
  return {stories:seed, profile:{name:"अनाम पाठक",intro:"",wordsRead:0,bookmarks:[]}, theme:"light", drafts:{title:"",body:"",type:"",subtype:"",categories:[]}};
}
function saveState(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function wordCount(s=""){return (s.trim().match(/\S+/g)||[]).length;}
function minutesFor(s=""){return Math.max(1,Math.ceil(wordCount(s)/200));}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2500);}
function allCategories(){return ["सभी",...CATEGORIES];}
function renderChips(){
  document.getElementById("categoryChips").innerHTML=allCategories().map(c=>`<button class="chip ${c===activeCategory?"active":""}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
  document.getElementById("categoryChips").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{activeCategory=b.dataset.category;renderChips();renderStories();}));
}
function storyCard(s){
  const cats=(s.categories||[]).map(c=>`<span class="tag">${escapeHtml(c)}</span>`).join(" ");
  const excerpt=(s.body||"").replace(/\s+/g," ").slice(0,150);
  return `<article class="story-card"><div>${cats}</div><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.author||"अनाम लेखक")} · ${escapeHtml(s.type||"रचना")}${s.subtype?" / "+escapeHtml(s.subtype):""}</p><p class="excerpt">${escapeHtml(excerpt)}${excerpt.length>=150?"…":""}</p><div class="story-meta"><span>◉ ${s.reads||0} पाठक · लगभग ${minutesFor(s.body)} मिनट</span><button data-read="${escapeHtml(s.id)}">पढ़ें ↗</button></div></article>`;
}
function renderStories(){
  let list=[...state.stories].sort((a,b)=>(b.created||0)-(a.created||0));
  if(activeCategory!=="सभी")list=list.filter(s=>(s.categories||[]).includes(activeCategory));
  document.getElementById("storyCount").textContent=`${list.length} रचनाएँ`;
  document.getElementById("storyList").innerHTML=list.map(storyCard).join("");
  document.getElementById("emptyState").classList.toggle("hidden",list.length!==0);
  document.getElementById("storyList").classList.toggle("hidden",list.length===0);
  document.getElementById("storyHeading").textContent=activeCategory==="सभी"?"नई और लोकप्रिय रचनाएँ":activeCategory+" की रचनाएँ";
  bindReadButtons();
}
function bindReadButtons(){document.querySelectorAll("[data-read]").forEach(b=>b.addEventListener("click",()=>openReader(b.dataset.read)));}
function renderCategoriesForm(){
  document.getElementById("formCategories").innerHTML=CATEGORIES.map(c=>`<label><input type="checkbox" value="${escapeHtml(c)}"> ${escapeHtml(c)}</label>`).join("");
  document.querySelectorAll("#formCategories input").forEach(cb=>cb.addEventListener("change",()=>{
    const checked=[...document.querySelectorAll("#formCategories input:checked")];
    if(checked.length>4){cb.checked=false;toast("एक रचना के लिए अधिकतम चार श्रेणियाँ चुन सकते हैं।");}
  }));
}
function updateSubtypes(){
  const type=document.getElementById("formType").value;
  const sel=document.getElementById("formSubType");
  sel.innerHTML=type==="चंपू काव्य"?'<option value="">उपप्रकार आवश्यक नहीं</option>':type?'<option value="">उपप्रकार चुनें</option>'+SUBTYPES[type].map(s=>`<option>${escapeHtml(s)}</option>`).join(""):'<option value="">पहले रूप चुनें</option>';
  sel.required=!!type&&type!=="चंपू काव्य";
}
function saveDraftFromForm(){
  state.drafts={title:document.getElementById("storyTitle").value,body:document.getElementById("storyBody").value,type:document.getElementById("formType").value,subtype:document.getElementById("formSubType").value,categories:[...document.querySelectorAll("#formCategories input:checked")].map(x=>x.value)};
  saveState();document.getElementById("draftStatus").textContent="मसौदा इसी डिवाइस पर सुरक्षित";
  document.getElementById("charCount").textContent=`${document.getElementById("storyBody").value.length} अक्षर`;
}
function restoreDraft(){
  const d=state.drafts||{};
  document.getElementById("storyTitle").value=d.title||"";
  document.getElementById("storyBody").value=d.body||"";
  document.getElementById("formType").value=d.type||"";
  updateSubtypes();
  document.getElementById("formSubType").value=d.subtype||"";
  document.querySelectorAll("#formCategories input").forEach(cb=>cb.checked=(d.categories||[]).includes(cb.value));
  document.getElementById("charCount").textContent=`${(d.body||"").length} अक्षर`;
}
function openWrite(){
  restoreDraft();document.getElementById("writeDialog").showModal();
}
function publishStory(e){
  e.preventDefault();
  const title=document.getElementById("storyTitle").value.trim();
  const body=document.getElementById("storyBody").value.trim();
  const type=document.getElementById("formType").value;
  const subtype=document.getElementById("formSubType").value;
  const categories=[...document.querySelectorAll("#formCategories input:checked")].map(x=>x.value);
  if(!title||!body||!type||categories.length<1){toast("शीर्षक, रचना का रूप, सामग्री और कम-से-कम एक श्रेणी भरें।");return;}
  if(type!=="चंपू काव्य"&&!subtype){toast("कृपया रचना का उपप्रकार चुनें।");return;}
  const story={id:"story-"+Date.now(),title,body,type,subtype,categories,author:state.profile.name||"अनाम लेखक",created:Date.now(),reads:0,minutes:minutesFor(body)};
  state.stories.unshift(story);state.drafts={title:"",body:"",type:"",subtype:"",categories:[]};saveState();
  document.getElementById("writeDialog").close();renderStories();renderProfile();toast("रचना इस डिवाइस पर प्रकाशित हो गई।");
}
function openReader(id){
  const s=state.stories.find(x=>x.id===id);if(!s)return;
  currentReaderId=id;readingStartedAt=Date.now();
  document.getElementById("readerTitle").textContent=s.title;
  document.getElementById("readerCategory").textContent=[s.type,s.subtype,...(s.categories||[])].filter(Boolean).join(" · ");
  document.getElementById("readerAuthor").textContent="रचनाकार: "+(s.author||"अनाम लेखक");
  document.getElementById("readerBody").textContent=s.body;
  document.getElementById("readerMeta").textContent=`लगभग ${minutesFor(s.body)} मिनट`;
  document.getElementById("readerWords").textContent=`${wordCount(s.body)} शब्द`;
  document.getElementById("bookmarkButton").textContent=(state.profile.bookmarks||[]).includes(id)?"♥":"♧";
  document.getElementById("readerDialog").showModal();
}
function finishReading(){
  const s=state.stories.find(x=>x.id===currentReaderId);if(!s)return;
  s.reads=(s.reads||0)+1;
  const elapsed=(Date.now()-readingStartedAt)/1000;
  const estimated=Math.min(wordCount(s.body),Math.round(wordCount(s.body)*Math.min(1,Math.max(.15,elapsed/(minutesFor(s.body)*60)))));
  state.profile.wordsRead=(state.profile.wordsRead||0)+estimated;
  saveState();document.getElementById("readerDialog").close();renderStories();renderProfile();toast(`पठन दर्ज हुआ: लगभग ${estimated} शब्द`);
}
function toggleBookmark(){
  if(!currentReaderId)return;
  const list=state.profile.bookmarks||(state.profile.bookmarks=[]);
  const i=list.indexOf(currentReaderId);
  if(i>=0)list.splice(i,1);else list.push(currentReaderId);
  saveState();document.getElementById("bookmarkButton").textContent=i>=0?"♧":"♥";renderLibrary();toast(i>=0?"बुकमार्क हटाया गया":"पुस्तकालय में बुकमार्क किया गया");
}
function renderLibrary(){
  const ids=state.profile.bookmarks||[];
  const list=state.stories.filter(s=>ids.includes(s.id));
  document.getElementById("libraryList").innerHTML=list.length?list.map(storyCard).join():'<div class="empty-state"><span class="empty-flower">✿</span><h3>आपका पुस्तकालय खाली है</h3><p>किसी रचना को खोलकर बुकमार्क करें। वह यहाँ दिखाई देगी।</p></div>';
  bindReadButtons();
}
function renderProfile(){
  const p=state.profile;
  document.getElementById("profileAvatar").textContent=(p.name||"अ").trim().slice(0,1);
  document.getElementById("profileName").textContent=p.name||"अनाम पाठक";
  document.getElementById("profileRole").textContent=state.stories.some(s=>s.author===p.name)?"लेखक / कवि · पाठक":"पाठक";
  document.getElementById("introInput").value=p.intro||"";
  document.getElementById("introCount").textContent=`${(p.intro||"").length}/1000 अक्षर`;
  document.getElementById("wordsRead").textContent=(p.wordsRead||0).toLocaleString("hi-IN");
  const mine=state.stories.filter(s=>s.author===p.name);
  document.getElementById("publishedCount").textContent=mine.length;
  document.getElementById("myStoryList").innerHTML=mine.length?mine.map(storyCard).join(""):'<p class="muted">अभी आपने कोई रचना प्रकाशित नहीं की है।</p>';
  bindReadButtons();
}
function switchTab(tab){
  activeTab=tab;
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  document.querySelector(".app-shell").classList.toggle("hidden",tab!=="home");
  ["library","profile","settings"].forEach(t=>document.getElementById(t+"View").classList.toggle("hidden",tab!==t));
  if(tab==="write"){openWrite();document.querySelector('[data-tab="home"]').classList.remove("active");}
  if(tab==="library")renderLibrary();
  if(tab==="profile")renderProfile();
  window.scrollTo({top:0,behavior:"smooth"});
}
function applyTheme(){document.body.classList.toggle("dark",state.theme==="dark");}
function init(){
  applyTheme();renderCategoriesForm();renderChips();renderStories();renderProfile();renderLibrary();
  document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
  document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.go)));
  document.getElementById("profileShortcut").addEventListener("click",()=>switchTab("profile"));
  document.getElementById("themeToggle").addEventListener("click",toggleTheme);
  document.getElementById("themeToggle2").addEventListener("click",toggleTheme);
  document.getElementById("formType").addEventListener("change",()=>{updateSubtypes();saveDraftFromForm();});
  document.getElementById("storyForm").addEventListener("submit",publishStory);
  document.getElementById("storyTitle").addEventListener("input",saveDraftFromForm);
  document.getElementById("storyBody").addEventListener("input",saveDraftFromForm);
  document.getElementById("formSubType").addEventListener("change",saveDraftFromForm);
  document.getElementById("formCategories").addEventListener("change",saveDraftFromForm);
  document.getElementById("closeWrite").addEventListener("click",()=>document.getElementById("writeDialog").close());
  document.getElementById("closeReader").addEventListener("click",()=>document.getElementById("readerDialog").close());
  document.getElementById("finishReading").addEventListener("click",finishReading);
  document.getElementById("bookmarkButton").addEventListener("click",toggleBookmark);
  document.getElementById("clearCategory").addEventListener("click",()=>{activeCategory="सभी";renderChips();renderStories();});
  document.getElementById("introInput").addEventListener("input",e=>document.getElementById("introCount").textContent=`${e.target.value.length}/1000 अक्षर`);
  document.getElementById("saveProfile").addEventListener("click",()=>{state.profile.intro=document.getElementById("introInput").value.slice(0,1000);saveState();toast("परिचय सुरक्षित हो गया।");});
  document.getElementById("editProfile").addEventListener("click",()=>{const name=prompt("अपना प्रदर्शित नाम लिखें:",state.profile.name||"अनाम पाठक");if(name&&name.trim()){state.profile.name=name.trim().slice(0,60);saveState();renderProfile();toast("नाम अपडेट हो गया।");}});
  document.getElementById("resetData").addEventListener("click",()=>{if(confirm("क्या स्थानीय डेमो डेटा मिटाकर शुरुआत करें?")){localStorage.removeItem(STORAGE);state=loadState();init();switchTab("home");toast("डेमो रीसेट हो गया।");}});
  document.getElementById("writeDialog").addEventListener("close",saveDraftFromForm);
  if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
function toggleTheme(){state.theme=state.theme==="dark"?"light":"dark";saveState();applyTheme();}
init();
