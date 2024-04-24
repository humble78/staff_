import{$ as r}from"./4mz4lLz1.js";import"./DMW5eoIZ.js";var n={1:"১",2:"২",3:"৩",4:"৪",5:"৫",6:"৬",7:"৭",8:"৮",9:"৯",0:"০"},m={"১":"1","২":"2","৩":"3","৪":"4","৫":"5","৬":"6","৭":"7","৮":"8","৯":"9","০":"0"},s={name:"bn-bd",weekdays:"রবিবার_সোমবার_মঙ্গলবার_বুধবার_বৃহস্পতিবার_শুক্রবার_শনিবার".split("_"),months:"জানুয়ারি_ফেব্রুয়ারি_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্টেম্বর_অক্টোবর_নভেম্বর_ডিসেম্বর".split("_"),weekdaysShort:"রবি_সোম_মঙ্গল_বুধ_বৃহস্পতি_শুক্র_শনি".split("_"),monthsShort:"জানু_ফেব্রু_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্ট_অক্টো_নভে_ডিসে".split("_"),weekdaysMin:"রবি_সোম_মঙ্গ_বুধ_বৃহঃ_শুক্র_শনি".split("_"),weekStart:0,preparse:function(_){return _.replace(/[১২৩৪৫৬৭৮৯০]/g,function(t){return m[t]})},postformat:function(_){return _.replace(/\d/g,function(t){return n[t]})},ordinal:function(_){var t=["ই","লা","রা","ঠা","শে"],e=_%100;return"["+_+(t[(e-20)%10]||t[e]||t[0])+"]"},formats:{LT:"A h:mm সময়",LTS:"A h:mm:ss সময়",L:"DD/MM/YYYY খ্রিস্টাব্দ",LL:"D MMMM YYYY খ্রিস্টাব্দ",LLL:"D MMMM YYYY খ্রিস্টাব্দ, A h:mm সময়",LLLL:"dddd, D MMMM YYYY খ্রিস্টাব্দ, A h:mm সময়"},meridiem:function(_){return _<4?"রাত":_<6?"ভোর":_<12?"সকাল":_<15?"দুপুর":_<18?"বিকাল":_<20?"সন্ধ্যা":"রাত"},relativeTime:{future:"%s পরে",past:"%s আগে",s:"কয়েক সেকেন্ড",m:"এক মিনিট",mm:"%d মিনিট",h:"এক ঘন্টা",hh:"%d ঘন্টা",d:"এক দিন",dd:"%d দিন",M:"এক মাস",MM:"%d মাস",y:"এক বছর",yy:"%d বছর"}};r.locale(s,null,!0);export{s as default};
