#!/usr/bin/env node

import whoisClient from "../index";

const args = process.argv.splice(2);
const domain = args[0];

if (domain) {
    whoisClient(domain)
      .then(response => console.dir(response, {depth: null}))
      .catch(console.error)
} else {
    console.log("Syntax: 'whois-client example.com`");
}
