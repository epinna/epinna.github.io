---
comments: true
date: 2011-05-18 18:38:54
layout: post
slug: tunneling-ip-over-rtp
title: Tunneling IP over RTP
wordpress_id: 1094
categories:
- Networking
- Software
- StegoSIP
tags:
- encapsulation
- IP over RTP
- linux
- networking
- python
- rtp
- security
- sip
- steganography
- tunneling
- voip
- vpn
---

Per integrare una tesi di laurea svolta in Erasmus in Spagna, mi è stato chiesto di scrivere un programma che implementasse la steganografia sul protocollo SIP, allo scopo di offuscare dati all'interno di una comune chiamata VoIP.

Ho fatto di più e ho scritto un framework modulare che supporta il tunneling di traffico IP all'interno di qualsiasi protocollo, a patto che il protocollo ospitante sia senza controllo di integrità dei dati, come ICMP, UDP e la gran parte dei protocolli trasportati da UDP, come RTP o DNS. Il software, se fatto girare su due macchine che comunicano tra loro con uno dei protocolli supportati, *crea una connessione point-to-point simile a una VPN*, non cifrata ma comunque steganografata all'interno dello stream originale.

Il programma si chiama [StegoSIP](https://github.com/epinna/Stegosip) e per adesso supporta solo SIP e RTP, i protocolli standard utilizzati per le chiamate VoIP. Con poche righe di codice si possono creare nuovi moduli per supportare altri protocolli, e altre tecniche steganografiche per nascondere i dati. Il traffico incapsulato non è cifrato per questioni di performance, sta a voi utilizzare SSL e simili se necessitate totale riservatezza.

Nell'esempio in figura le due macchine allocano una rete IP point-to-point perfettamente funzionante e nascosta dentro quello che dall'esterno risulta come una normale chiamata telefonica VoIP.

![RTP tunnel]({{site.url}}/assets/img/stegosip.png)

C'è ancora del lavoro da fare, principalmente implementare più tecniche steganografiche per rendere il traffico incapsulato meno rilevabile ad analisi statistiche, e per creare meno rumore possibile sullo stream ospitante, a partire dalla tecnica [LSB](http://it.wikipedia.org/wiki/Steganografia#Steganografia_LSB.2Frumore_di_fondo). Continuo a lavorarci sopra documentando  le nuove features, chiunque voglia testare il software lo può scaricare dalla pagina di google code ufficiale su [github](https://github.com/epinna/Stegosip).
