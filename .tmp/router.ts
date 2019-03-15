import { UrlParser } from './url-parser';

export interface MetaRoute {

    /** Path the meta router uses */
    path: string;

    /** entry point of the routed client app */
    app: string;

    /** id of the HtmlElement used as outlet. Default: outlet */
    outlet: string;
}

export type HandleNotification = (tag: string, data: any) => void;

export interface MetaRouterConfig {
    hashPrefix: string;
    additionalHeight: number;
    handleNotification: HandleNotification;
    allowedOrigins: string;
}

/**
 * MetaRouter for routing between micro frontends
 */
export class MetaRouter {

    additionalConfig: MetaRouterConfig = {
        hashPrefix: '/',
        additionalHeight: 0,
        handleNotification: () => {},
        allowedOrigins: '*'
    };
    private route;

    private urlParser = new UrlParser();

    config(route: MetaRoute): void { this.route = route; }

    /**
     * initializes the router after configuring it
     */
    init(): void {
        window.addEventListener('message', this.handleMessage.bind(this), false);
        if (this.route) {
            this.go();
        }

        if (this.additionalConfig.allowedOrigins === 'same-origin') {
            this.additionalConfig.allowedOrigins = location.origin;
        }
    }

    /**
     * Preloads all the micro frontends by loading them into the page
     */
    preload(): void {
        this.ensureIframeCreated();
    }

    /**
     * Navigates to a configured meta route
     * @param path path of the routed client app
     * @param subRoute subRoute passed to the client app
     */
    go(subRoute?: string, data?: any): void {
        if (!this.route) throw Error('route not found: ' + this.route);

        this.ensureIframeCreated(subRoute);
        this.activateRoute(subRoute, data);
    }

    private handleMessage(event: MessageEvent): void {
        if (!event.data) return;

        if (this.additionalConfig.allowedOrigins === 'same-origin'
            && event.origin !== location.origin) {
                throw new Error('Received message from not allowed origin');
        }
        else if (this.additionalConfig.allowedOrigins !== '*') {
            let whiteList = this.additionalConfig.allowedOrigins.split(';');
            if (whiteList.indexOf(event.origin) === -1) {
                throw new Error('Received message from not allowed origin');
            }
        }

        if (event.data.message === 'routed') {
            this.additionalConfig.handleNotification('routed', '');
        } 
        else if (event.data.message === 'set-height') {
            this.resizeIframe(event.data.appPath, event.data.height);
        }
        else if (event.data.message === 'notification' && this.additionalConfig.handleNotification) {
            this.additionalConfig.handleNotification(event.data.tag, event.data.data);
        }
        else if (event.data.message === 'broadcast') {
            let iframe = this.getIframe(this.route);
            if (iframe) {
                iframe.contentWindow.postMessage({ message: 'notification', tag: event.data.tag, data: event.data.data  }, this.additionalConfig.allowedOrigins);
            }
            this.additionalConfig.handleNotification(event.data.tag, event.data.data);
        }

    }

    private resizeIframe(appPath: string, height: number): void {
        let iframe = document.getElementById(appPath);
        if (!iframe) return;
        let newHeight = Number(height) + this.additionalConfig.additionalHeight;
        if (newHeight > 0) {
            iframe.style.height = newHeight + 'px';
        }
    }

    private ensureIframeCreated(subRoute?: string): void {
        if (!this.getIframe(this.route)) {

            let url = '';

            if (subRoute) {
                url = this.route.app + '#' + this.additionalConfig.hashPrefix + subRoute;
            }
            else {
                url = this.route.app;
            }

            let iframe = document.createElement('iframe');
            iframe.style['display'] = 'none';
            iframe.src = url;
            iframe.id = this.route.path;
            iframe.className = 'outlet-frame';

            let outlet = this.getOutlet(this.route);
            if (!outlet) throw new Error(`outlet ${outlet} not found`);

            outlet.appendChild(iframe);
        }
    }

    private activateRoute(subRoute?: string, data?: any): void  {
        if (subRoute) {
            let activatedIframe = this.getIframe(this.route) as HTMLIFrameElement;
            activatedIframe.contentWindow.postMessage({message: 'sub-route', route: subRoute, data: data }, this.additionalConfig.allowedOrigins );
        }
    }

    private getIframe(route: MetaRoute): HTMLIFrameElement {
        return document.getElementById(route.path) as HTMLIFrameElement;
    }

    private getOutlet(route: MetaRoute): HTMLElement {
        let outlet = route.outlet || 'outlet';
        return document.getElementById(outlet) as HTMLElement;
    }
}
