# Nginx Registration Server
This very simple Node.js application is for dynamic configuration of an Nginx server when doing load balancing with dynamically created servers. A more complete explanation of the code has been posted at [http://blog.jeffgabriel.com/nginxloadbalancer.html](http://blog.jeffgabriel.com/nginxloadbalancer.html).

Files:
1.  Dockerfile - builds the registrationServer Node.js app into a docker based on Alpine Linux. 
2. compose.yml - uses Nexosis' custom image built by the dockerfile to startup the server and in this implementation share the volume from the nginx container called gateway. This approach didn't actually end up working out. However, I think there is merit in trying to pursue it further.
3. package.json - what you'd expect
4. registrationServer.js - the mini-app that is the whole point of this repo.
