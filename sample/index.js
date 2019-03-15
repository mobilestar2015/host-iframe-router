var MetaRouter = require('meta-spa-router').MetaRouter;

var config = [
    {
        path: 'televet',
        app: 'https://embrace-whitelabel.firebaseapp.com',
        outlet: 'outlet'
    }
];

window.addEventListener('load', function() { 

    var router = new MetaRouter();
    router.config(config);
    router.init();
    router.preload();

    router.additionalConfig.handleNotification = function (tag, data)  {
        console.debug('received message from routed app', {tag, data});
    }

    document.getElementById('link-aa')
            .addEventListener('click', function() { router.go('televet', 'pets/0/consultations/1') });

    document.getElementById('link-ab')
            .addEventListener('click', function() { router.go('televet', 'pets/0/create-consultation') });        
}); 
