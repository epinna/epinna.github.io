---
comments: true
date: 2010-06-18 00:43:01
layout: post
slug: scovare-i-pacchetti-meno-usati-con-unusedpkg
title: Scovare i pacchetti meno usati con unusedpkg
wordpress_id: 211
categories:
- Shell
- UnusedPkg
tags:
- bash
- coding
- debian
- linux
- slacware
- ubuntu
- unusedpkg
---

Unusedpkg è un tool che ho scritto per visualizzare i pacchetti meno usati di un sistema Linux, nel caso si voglia ripulire il sistema da applicazioni inutilizzate. 


E' uno script in bash che scansiona tutte le applicazioni installate sulla vostra distribuzione Linux, e registrando l'ultima volta in cui ogni pacchetto è stato utilizzato. Una volta raccolti i dati, i nomi dei pacchetti vengono visualizzati e ordinati rispetto all'ultima data di accesso. Supporta Debian, Ubuntu, Slackware, e distribuzioni derivate. Lo potete scaricare da [github](https://github.com/epinna/Unusedpkg).

L'utilizzo è molto semplice, già al primo avvio senza specificare opzioni inizia a scandagliare il filesystem per raccogliere le date di ultimo utilizzo, e poi mostrare la lista ordinata dei pacchetti. Richiamando l'help con il comando `./unusedpkg help` potete avere la descrizione dettagliata delle opzioni disponibili.

### Funzionamento e limitazioni

Unusedpkg svolge le seguenti procedure:


  * Estrae dal package manager (apt o pkgtool) le path di tutti i file installati dai pacchetti presenti sul sistema.
  * Salva la data più recente relativa ad ogni pacchetto nel file `~/.unusedpkg/pkglist`, ovvero la più recente tra quelle dei file che compongono il pacchetto. Per il calcolo si utilizzano solo i file nelle directory specificate nella variable d'ambiente $PATH.
  * Stampa i nomi dei pacchetti in maniera ordinata rispetto all'ultima data di utilizzo.

Può essere anche utilizzato per visualizzare l'ultimo utilizzo di ogni file di uno specifico pacchetto, con il comando `info`. E' anche possibile non limitare la raccolta dei dati ai percorsi definiti in $PATH, specificando l'opzione `-a`.

Le date rilevate dal programma sono da considerarsi indicative. Un sistema operativo accede ai propri file in diverse occasioni, e questo potrebbe falsare la data di ultimo utilizzo. Per limitare il problema unusedpkg scansiona solo i file presenti nelle directory specificate nella variabile d'ambiente $PATH, così da non interessare i file di sistema e focalizzarsi sulle applicazioni utente. In Slackware le rilevazioni su alcuni pacchetti potrebbero essere falsate, per colpa di alcuni script di post installazione che cambiano la corrispondenza tra effettiva path del file e path scritta nei metadata. 

### Insomma, non cancellate pacchetti senza motivo

Per evitare che spinti dalla fretta di liberare spazio sul sistema cancelliate applicazioni importanti, utilizzate `./unusedpkg info` per visualizzare le date degli accessi ai singoli file, e verificate il reale contenuto  del pacchetto con `dpkg -L`, o il comando corrispettivo per Slackware. 

Unusedpkg vi offre un ottimo colpo d'occhio sullo spazio sprecato sull'hard disk, voi metteteci il buon senso. 
