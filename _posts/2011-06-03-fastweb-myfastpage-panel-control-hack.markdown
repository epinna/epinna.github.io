---
comments: true
date: 2011-06-03 11:39:44
layout: post
slug: fastweb-myfastpage-panel-control-hack
title: Fastweb Myfastpage authentication control bypass
wordpress_id: 1213
categories:
- News
- Security
- Vulnerabilities
- Web Apps
tags:
- advisory
- fastweb
- hacking
- javascript
- myfastpage
- security
- vulnerability
- xss
---

> Aggiornamento 12/06/11 : la vulnerabilità XSS è stata fixata.

> Aggiornamento 08/06/11 : i pannelli sono stati riorganizzati, e ora l'utente può imporre l'autenticazione per accedere alla configurazione dell'abbonamento. L'XSS è ancora presente, ora è anche possibile configurare ESSID e password della wifi. La configurazione di default rimane comunque vulnerabile.

Un utente Fastweb che visita un sito malevolo appositamente preparato **permette ad un attaccante esterno di accedere ai pannelli di controllo del suo abbonamento**.

Una volta guadagnato l'accesso è possibile consultare e variare dati e recapiti personali, consumi voce e internet, configurare ESSID e password della wifi, modificare le configurazioni dell'abbonamento. Un semplice link malevolo pubblicato in una pagina molto trafficata permetterebbe di raccogliere e cambiare dati sensibili di numerosi utenti Fastweb.

Ho contattato il reparto sicurezza IT di FastWeb circa un mese fa per avvertirli della vulnerabilità, e nonostante la risposta gentile non è stata fatta alcuna correzione del baco nè mi hanno ricontattato per chiarimenti. 

Sono certo che altri service provider italiani abbiano problemi simili vista **la cattiva abitudine adottata da molti provider di far accedere l'utente ai pannelli di controllo di abbonamento e modem automaticamente, senza autenticazione con user e password, a patto che la richiesta provenga dalla rete casalinga del proprietario dell'abbonamento**. Questa sempificazione indebolisce l'infrastruttura, e rende vulnerabilità comuni come [XSS](http://en.wikipedia.org/wiki/Cross-site_scripting), [CSRF](http://en.wikipedia.org/wiki/Cross-site_request_forgery), [DNS rebinding](http://en.wikipedia.org/wiki/DNS_rebinding) catastrofiche per la privacy e la sicurezza dell'utente finale.

Ho pubblicato un POC per testare il vostro abbonamento Fastweb allo scopo di sensibilizzare gli utenti e far correggere il baco al più presto. Segui il collegamento per avviare il test.

[**Advisory tecnico.**](https://github.com/epinna/researches/tree/master/fastweb_myfastpage_XSS_security_bypass)




