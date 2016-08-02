
function getrandom(num1, num2) {
	if(num2 == undefined) {
		num2 = 0;
	}
	min = Math.min(num1, num2);
	max = Math.max(num1, num2);

	return Math.floor(Math.random()*(max-min)+min);

}

function shuffle(a) {
	var i = a.length, j;

	for(var j, x, i = a.length; i; j = parseInt(Math.random() * i), x = a[--i], a[i] = a[j], a[j] = x);
    
	return a;
};



attrmaps = { 
	'text-transform' : ['lowercase'],
	'text-decoration' : ['underline', 'overline', 'line-through' ],
	'color' : ['white','gray'],
	//'font-size' : [ (getrandom(20,70)) + 'px' ],
	'font-style' : [ 'italic', 'oblique' ],
	'font-family' : [ 'Tahoma', 'Courier', 'Impact', 'Times New Roman' ],
};
attrmaps_keys = Object.keys(attrmaps);

charmaps = {
	'e' : [ 'ë', 'Σ', 'Ξ', 'ξ', 'æ', '€', '3', 'Ё', '∋', '∈', 'ε'  ],
	'a' : [ 'α', 'å', '∧', '∀', '@', 'Æ' ],
	'i' : [ '!', '1', '↓', '⌊', '↑', '⇑', '⇓', 'ι', 'ז', '¡', '|',  ],
	'd' : [ 'Δ', 'b', 'Ð', 'Þ', 'δ', '∇', '⊇' ],
	't' : [ '⊥', 'τ', 'ϒ', '†', '↑', 'T' ], 
	'O' : [ '@', 'O', '0', 'o', '·', 'Φ', 'Θ', 'Ö', '◊', '¤', '♣', '⊗', '⊕',  '♠', '♦' ],
	'binary' : [ 0, 1 ],
	'cursor' : [ '#', '_', '♣', '⊗', '⊕', '♠', '♦', '◊', 'Θ', 'Φ', '@' ],
	'circle' : [ '⊗', '⊕' ],
	
};
charmaps_keys = Object.keys(charmaps);


effects = [ 
	'roll', 
	'attribute_blink' 
	];
animations = [ 
	//'textanimate_transform_recover',
	'textanimate_slide_char',  
	'textanimate_randomize_n_chars'
	];

function choose(list) {
	
	return list[getrandom(list.length)];
}

function addtags (str) {

    var str_spanned = '';	    
    for (var i = 0; i < str.length; i++) {
	str_spanned += '<span class="titlechars" id="titlechar' + i + '">' + str.charAt(i) + '</span>';	
    }
    return str_spanned;
}

function getCharList (chr) {
	
    if (charmaps[chr] != undefined) {
		chr = chr.toLowerCase();
    	return charmaps[chr];
    }
    return charmaps[choose(charmaps_keys)];
}    

function getEffect(effect) {

    if (effects[effect]) {
    	return effect;
    }
    return choose(effects);

}

function getAnimation(animation) {

    if (animations[animation]) {
    	return animation;
    }
    return choose(animations);

}

function getAttrKeyValue (keyreq) {
	
    if (attrmaps_keys[keyreq]) 
    	key = keyreq;
    else 
	key = choose(attrmaps_keys);

    randvalue = choose(attrmaps[key]);

    return [ key, randvalue ];

}    



(function($) {


    $.fn.spanize = function () {

        var $ele = $(this); 

	    // Set window.text_original only at first call
	    if ($ele.data('text_original') == undefined)
	    	$ele.data('text_original', $.trim($ele.text()));

	    // Add span tags
	    str_spanned = addtags($ele.data('text_original'));
	    $ele.html(str_spanned);

    }

    $.fn.getCharSpans = function() {
        var $ele = $(this);
	    return $ele.children('span');
    }

    $.fn.attribute_blink = function(attrkey, iterations, delay, incdelay, defaultattrvalue, oneatime) {

        attrkeyvalue = getAttrKeyValue(attrkey);
        attrkey = attrkeyvalue[0];
        attrvalue = attrkeyvalue[1];

        if(iterations == undefined) 
			iterations = 5;
        if(incdelay  == undefined)
			incdelay = 0;
		if(oneatime == undefined)
			oneatime = false;
			
		charindex = 0;

		$.each(this, function() {

			var $ele = $(this);
			
			if(delay == undefined)
				$ele.delay = getrandom(100,700);
			else
				$ele.delay = delay;
				
				
			if (oneatime)
				$ele.delay = delay*(charindex+1);

			if(defaultattrvalue == undefined)
				$ele.defaultattrvalue = $ele.css(attrkey);
			else
				$ele.defaultattrvalue = defaultattrvalue;

			$ele.progress = 0;
			
			//console.log('attribute_blink iter:', iterations, 'delay:',  $ele.delay, 'incdel:', incdelay, 'attr:', attrkey, 'defval:', $ele.defaultattrvalue, 'onetime', oneatime);

			var timer = setTimeout(function callback() {

				if ($ele.progress >= iterations) {
					$ele.css(attrkey, $ele.defaultattrvalue);
				}
				else {		
					if(oneatime) {
						// Only one character modified per time: previous restored e base delay
						$ele.prev().css(attrkey,$ele.prev().$defaultattrvalue);
						$ele.delay = delay;
					}
					
					$ele.css(attrkey, ($ele.progress % 2 == 1) ? $ele.defaultattrvalue : attrvalue );
					setTimeout(callback, $ele.delay += incdelay);	
				}
				$ele.progress++;
				  
			}, $ele.delay);
		  
		    charindex++;
		  
		});
    }


    $.fn.roll = function(charlist, iterations, delay, incdelay, defaultchar, oneatime) {

		charindex = 0;

		if(iterations == undefined) 
			iterations = 10;

	        if(incdelay  == undefined)
			incdelay = 25;

		if(oneatime == undefined)
			oneatime = false;	    

		// In oneatime mode characted doesn't change
		if(oneatime && charlist == undefined) 
			charlist = shuffle(getCharList());

		$.each(this, function() {

    		        var $ele = $(this);

			if(charlist == undefined) {
				$ele.charlist = shuffle(getCharList($ele.text()));
			}
			else
				$ele.charlist = shuffle(charlist);
	    
			if(delay == undefined) 
				$ele.delay = 100+(10*charindex);
			else
				$ele.delay = delay;

			if (oneatime)
				$ele.delay = delay*(charindex+1);

			if(defaultchar == undefined)
				$ele.defaultchar = $ele.text();
			else
				$ele.defaultchar = defaultchar;


			$ele.progress = 0;
			//console.log('roll iter:', iterations, 'charlist:', $ele.charlist, 'delay:',  $ele.delay, 'incdel:', incdelay, 'attr:', $ele.defaultchar, 'onetime', oneatime);

			var timer = setTimeout(function callback() {

				if ($ele.progress >= iterations) {
					$ele.text($ele.defaultchar);
				}
				else {
					if(oneatime)  {
						newchar = $ele.charlist[0];
					}
					else 
						newchar = $ele.charlist[$ele.progress % $ele.charlist.length];

					$ele.text(newchar);	
									
					if(oneatime) {
						$ele.prev().text($ele.prev().defaultchar);
						$ele.delay = delay;
					}
						
					setTimeout(callback, $ele.delay += incdelay);	
				}
				$ele.progress++;
					  
			  }, $ele.delay);

			  charindex++;

		});

    }   
	
    $.fn.textanimate_randomize_n_chars = function(effect, n) {

	   var effect = getEffect(effect);

	   $.each(this, function() {
		   var $charspans = shuffle($(this).getCharSpans());

		   if (n < 1 || n > $charspans.length || n == undefined) {

			max = $charspans.length;

			if(effect == 'roll')
				min = 0;
			// increase min in case of blinking effect to get more visibility
			else if(effect == 'attribute_blink') 
				min = $charspans.length/2;

			n = getrandom(min, max);
		   }

		   var $selected_charspans = shuffle($charspans).slice(0,n);

		   $selected_charspans[effect]();
	   });
    }

    $.fn.textanimate_slide_char = function(effect) {

	   var effect = getEffect(effect);

	   var $charspans = $(this).getCharSpans();

	   var map = undefined;
	   if (effect == 'roll')
			map = getCharList('cursor');
			
	   $charspans[effect](map, 1, 150, undefined, undefined, true);
    }

    //$.fn.textanimate_transform_recover = function(effect) {

	   //var $charspans = $(this).getCharSpans();
	   //var map = shuffle(getCharList('cursor'));
	   //$charspans['roll']([ map[0] ], 1, 150, undefined, map[0], true);
    //}

 
    $.fn.randomScramble = function () {
	$(this).spanize();
	$(this)[getAnimation()]();
    }

    
})(jQuery);
