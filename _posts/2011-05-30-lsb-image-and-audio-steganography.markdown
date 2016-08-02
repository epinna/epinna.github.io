---
comments: true
date: 2011-05-30 21:35:14
layout: post
slug: lsb-image-and-audio-steganography
title: LSB image and audio steganography
wordpress_id: 1155
categories:
- How to
- Snippets
- Software
tags:
- C
- coding
- steganography
- tunneling
---

I formati multimediali digitali tendono a essere particolarmente inaccurati poiché non necessitano di precisione: l'orecchio umano non coglie le minime differenze di suono. Un'orchestra registrata da due dispositivi diversi produce un segnale digitale sensibilmente diverso, ma una volta riprodotti suonano al nostro orecchio allo stesso modo.

In molti formati digitali di immagini e audio il bit meno significativo di ogni byte di cui sono composti è  ininfluente sulla visualizzazione o riproduzione, e può essere cambiato senza modificare l'immagine in maniera rilevante. Per esempio, una immagine bitmap con profondità di 24 bit, rappresenta per ogni pixel i valori dei tre colori: Rosso, Verde e Blu ogniuno su 8 bit. Se consideriamo che ogni colore può assumere 28 valori differenti, è chiaro che alla variazione del bit più basso non noteremo alcun cambiamento di intensità del colore.

Questo permette di nascondere anche lunghi messaggi all'interno di un file multimediale _spalmandolo_ sui Least Significant Bit in modo da causare cambiamenti minimi. Per illustrare il concetto, chiamiamo _messaggio_ i dati che intendiamo nascondere, e _cover-medium_ i dati dento i quali intendiamo nascondere il messaggio.  Assumiamo che un file audio codificato con campioni di 8 bit contenga i seguenti  8 byte di data, da utilizzare come cover-medium:

```
10110100 -> 0xb4
11100101 -> 0xe5
10001011 -> 0x8b
10101100 -> 0xac
11010001 -> 0xd1
10010111 -> 0x97
00010101 -> 0x15
01101000 -> 0x68
```


Se si intende nascondere un messaggio con valore 0xd6, ovvero 110110110, ogni bit meno significativo dei byte dei cover-medium può essere modificato per rappresentare gli 8 bit del Messaggio:

```
10110101 -> 0xb5
11100101 -> 0xe5
10001010 -> 0x8a
10101101 -> 0xad
11010000 -> 0xd0
10010111 -> 0x97
00010101 -> 0x15
01101000 -> 0x68
```

Comparando questi con gli 8 byte originali dei dati steganografati con il cover-data iniziale, si nota che la *media dei byte alterati è  il 50%*, nonostante i stego-dati contengano l'intero messaggio da nascondere.

Per utilizzare questa tecnica è necessario che il cover-medium sia grande almeno 8 volte il messaggio da nascondere. L'obbiettivo di questa tecnica steganografica è nascondere il messaggio all'interno di un cover-medium in maniera che sia sensorialmente impercettibile, e difficile da scovare con analisi statistiche. La applicazione della tecnica LSB si complica nei casi in cui non abbiamo la conoscenza pregressa del codec utilizzato per la codifica del flusso audio o video, e in caso di codec che utilizzano compressione, diversa grandezza nei campionamenti, e particolari tecniche di codifica.

## Una piccola libreria per la steganografia LSB

Ho implementato una piccola libreria in C per il mio progetto [stegosip](http://disse.cting.org/software/tunneling-ip-over-rtp/) che mi permettesse di inserire ed estrarre al volo dati steganografati. Non si limita a modificare l'ultimo bit, ma supporta anche la modifica e il recupero di più bit per ogni byte. Un ringraziamento a Cyrus che mi ha dato una mano con le operazioni bitwise. La libreria contiene due piccole funzioni `modifyBits()` e `recoverBits()`, dal nome abbastanza esplicativo. Vediamole nel dettaglio:

### *ModifyBits()*


*Riceve il messaggio da nascondere, il medium in cui steganografare, le rispettive lunghezze, e la quantità di bit da modificare ogni byte. Al ritorno della funzione, il medium steganografato è contenuto in _medium_.*

``` {cpp}
void ModifyBits(unsigned char *message, unsigned char *medium, unsigned int messagesize, unsigned int mediumsize, int bitperbyte) {

   if( messagesize > mediumsize/(8/bitperbyte) || (bitperbyte != 1 && bitperbyte != 2 && bitperbyte != 4 && bitperbyte != 8 ) ) {
        printf("[ERR] ModifyBits error: messagesize: %d, mediumsize: %d, bitperbyte: %d\n", messagesize, mediumsize, bitperbyte);
   }
   else {
        int messageindex = 0, mediumindex = 0;
        unsigned char d;

        for (; messageindex < messagesize; messageindex++) {
              d = message[messageindex];
              int bitcount = 0;

              for (; bitcount<8 && mediumindex < mediumsize; bitcount+=bitperbyte, mediumindex+=1, d>>=bitperbyte) {
                    medium[mediumindex] = ( d | medium[mediumindex] & ( ~0 << bitperbyte) );
               }
           }
    }
}

```

Nel primo loop, ciclo ogni byte del messaggio da steganografare e lo metto in `d`. Nel secondo loop, per ogni bit di un byte e finchè non si supera `mediumsize`, incrementa gli indici, si sposta nel medium di 1,  e shifta il byte `d` che vogliamo inserire per tagliarlo della lunghezza specificata in `bitperbyte`.

Con in `d` i bit che intendiamo inserire nella parte bassa di `medium[mediumindex]` ,

  1. Tronco `medium[mediumindex]` alla 	lunghezza di `bitperbyte` `medium[mediumindex] & ( ~0 << bitperbyte)`
  2. Fondo il risultato con `d`, che contiene 	i bit da inserire della lunghezza `bitperbyte` `(d | medium[mediumindex] & ( ~0 << bitperbyte))`
  3. Metto il risultato di nuovo in `medium[mediumindex].` Ecco la linea completa.

```cpp
medium[mediumindex] = ( d | medium[mediumindex] & ( ~0 << bitperbyte));
```

Alla fine dei due cicli, ogni byte di `medium[]` contiene nei propri `bitperbyte` bit bassi il messaggio occultato.

### *RecoverBits()*

*Riceve il messaggio da estrarre, il medium steganografato, le rispettive lunghezze, e la quantità di bit da modificare ogni byte. Al ritorno dalla funzione, il messaggio estratto è contenuto in _message_.*

```cpp

void RecoverBits(unsigned char *message, unsigned char *medium, int messagesize, int mediumsize, int bitperbyte) {

    if( messagesize > mediumsize/(8/bitperbyte) || (bitperbyte != 1 && bitperbyte != 2 && bitperbyte != 4 && bitperbyte != 8 ) ) {
        printf("[ERR] RecoverBits error: messagesize: %d, mediumsize: %d, bitperbyte: %d \n", messagesize, mediumsize, bitperbyte);
    }
    else {
        long int messageindex = 0;
        long int mediumindex = 0;

        for (messageindex = 0; messageindex < messagesize; messageindex++) {
            unsigned char mask = 0;
            int bitcount = 0;

            for(; bitcount < 8 && mediumindex < mediumsize; bitcount+=bitperbyte, mediumindex+=1, mask+=bitperbyte) {
                unsigned char newbit = ~( ( ~0 ) << bitperbyte ) & medium[mediumindex];
                message[messageindex] = (message[messageindex] & ~(1 << mask)) | (newbit << mask);
             }
        }
    }
}

```

Nel primo loop, ciclo per ogni byte del messaggio da estrarre. Nel secondo loop, per ogni bit di un byte e finchè non si supera `mediumsize`, incrementa gli indici, si sposta nel medium di 1,  e si incrementa la maschera `mask` del numero `bitperbyte`. Ad ogni iterazione la nuova maschera determina il range di bit che devo sostituire per ricostruire il byte del messaggio.

	
  1. Tronco `medium[mediumindex] `alla lunghezza di `bitperbyte` per estrarre il `newbits` per ricostruire il messaggio `newbits = ~( ~0 << bitperbyte ) & medium[mediumindex];`
  2. Preparo `message[messageindex]` per l'inserzione di `newbit` alla corretta posizione, mettendo i bit specificati da `mask` a 0 `(message[messageindex]& 	~(1<<mask))`
  3. Con la stessa `mask` sposto i bit di `newbit` alla corretta posizione in cui vanno inseriti nel byte di `message[messageindex]` `(newbits<<mask);`
  4. Fondo il range di bit precedentemente messo a 0 di `message[messageindex]`con i newbits correttamente shiftati nella stessa posizione, e metto il risultato di nuovo in `message[messageindex].` Ecco la linea completa.

``` {cpp}
message[messageindex] = (message[messageindex]& ~(1<<mask)) | (newbits<<mask); 
```


Alla fine dei due cicli, è stato estratta da ogni byte la giusta porzione di bit per ricostruire i byte del messaggio originale in `message[]`.

## Scaricare LSBlib

Potete trovare il file .c [qua](http://disse.cting.org/codes/LSBlib.c), sono poche righe, potete utilizzarla e provarla dove volete. In quanto libreria non è eseguibile (non contiene la funzione `main()`), e nel progetto [stegosip](http://disse.cting.org/software/tunneling-ip-over-rtp/) di cui fa parte la compilo come libreria dinamica e la carico con le `ctypes ` di python. Sta a voi di utilizzarla _copiaincollando_ le funzioni o come libreria dinamica come faccio io. Usatela senza restrizioni e steganografate come non avete mai fatto in vita vostra.

