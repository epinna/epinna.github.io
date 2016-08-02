---
comments: true
date: 2010-06-28 21:59:39
layout: post
slug: enabler-cisco-enable-bruteforcer
title: Enabler - cisco enable bruteforcer
wordpress_id: 614
categories:
- Pentesting
- Security
- Software
tags:
- brute force
- C
- cisco
- coding
- hacking
- router
---

Per dovere storico pubblico un tool che scrissi circa 9 anni fa: è un brute forcer di account di amministratore su router Cisco, che fu incluso nella versione 2 di [Backtrack](http://backtrack.offensive-security.com/) e sostituito nelle versioni successive da un ottimo tool della crew THC, il bruteforcer _universale_ [hydra](http://freeworld.thc.org/thc-hydra/). Il nome del tool è Enabler e rimane ancora qualche traccia nella [lista dei tool](http://backtrack.offensive-security.com/index.php/Tools) inclusi in Backtrack, a quanto pare poco aggiornata.

Per chi non conoscesse il [funzionamento](http://pages.swcp.com/~jgentry/topo/cisco.htm) dei router Cisco, il comando **enable** abilita i privilegi di amministratore, chiamati sul sistema operativo IOS _modalità privileged EXEC_. Esattamente come su Linux siamo abituati a eseguire `sudo su`, o `sudo -s` per accedere alla shell di root, su un terminale Cisco si inserisce il comando `enable` seguito dalla password dell'amministratore. Enabler si connette alla porta 23 di un router Cisco sul quale già possediamo un account utente, effettua il login, e avvia un attacco di forza bruta nel tentativo di trovare una password di amministratore.

**E' possibile scaricare il sorgente del programma da questo [link](https://gist.github.com/2304345).**

Vediamo come si utilizza il tool: compilate il sorgente con gcc, ed eseguite il tool specificando l'host del dispositivo Cisco da forzare, l'utente e la password dell'account di cui disponiamo, e una file di testo che contenente le password da provare per accedere all'account di amministratore. Enabler proverà queste password una per una, come si vede dall'output sottostante

```bash
utente@linux:~$ gcc -o enabler enabler.c
utente@linux:~$ ./enabler <router ip> -u user password passlist.txt
[`] enabler.
[`] cisco internal bruteforcer. concept by anyone
[`] coded by norby
[`]
[`] only password needed. sending [password]
[`] seems we are logged in : )
[`] cisco... wrong password
[`] admin... wrong password
[`] 1234... wrong password
...
[`] Possible password found: adminadmin
```

In questo caso la password _adminadmin_ trovata ci permetterebbe di prendere pieno possesso del router. Non è certo un tool innovativo, ma vi assicuro che nel 2001 non esisteva niente del genere. E apprezzate l'adolescente che invece di spaccarsi di playstation si spaccava di programmazione C.
