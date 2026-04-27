export namespace domain {
	
	export class AuthConfig {
	    type: string;
	    bearerToken?: string;
	    username?: string;
	    password?: string;
	    apiKey?: string;
	    apiKeyLocation?: string;
	    apiKeyName?: string;
	
	    static createFrom(source: any = {}) {
	        return new AuthConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.bearerToken = source["bearerToken"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.apiKey = source["apiKey"];
	        this.apiKeyLocation = source["apiKeyLocation"];
	        this.apiKeyName = source["apiKeyName"];
	    }
	}
	export class KeyValueItem {
	    key: string;
	    value: string;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new KeyValueItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.value = source["value"];
	        this.enabled = source["enabled"];
	    }
	}
	export class BodyConfig {
	    type: string;
	    content?: string;
	    formData?: KeyValueItem[];
	
	    static createFrom(source: any = {}) {
	        return new BodyConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.content = source["content"];
	        this.formData = this.convertValues(source["formData"], KeyValueItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ExecutionResult {
	    statusCode: number;
	    statusText: string;
	    responseTime: number;
	    responseSize: number;
	    responseHeaders: Record<string, string>;
	    responseBody: string;
	    error?: string;
	    // Go type: time
	    timestamp: any;
	
	    static createFrom(source: any = {}) {
	        return new ExecutionResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.statusCode = source["statusCode"];
	        this.statusText = source["statusText"];
	        this.responseTime = source["responseTime"];
	        this.responseSize = source["responseSize"];
	        this.responseHeaders = source["responseHeaders"];
	        this.responseBody = source["responseBody"];
	        this.error = source["error"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RequestNode {
	    id: string;
	    collectionId: string;
	    name: string;
	    method: string;
	    url: string;
	    queryParams: KeyValueItem[];
	    headers: KeyValueItem[];
	    body?: BodyConfig;
	    authOverride?: AuthConfig;
	    proxyOverrideId?: string;
	    lastRun?: ExecutionResult;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new RequestNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.collectionId = source["collectionId"];
	        this.name = source["name"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.queryParams = this.convertValues(source["queryParams"], KeyValueItem);
	        this.headers = this.convertValues(source["headers"], KeyValueItem);
	        this.body = this.convertValues(source["body"], BodyConfig);
	        this.authOverride = this.convertValues(source["authOverride"], AuthConfig);
	        this.proxyOverrideId = source["proxyOverrideId"];
	        this.lastRun = this.convertValues(source["lastRun"], ExecutionResult);
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProxyConfig {
	    id: string;
	    name: string;
	    scheme: string;
	    host: string;
	    port: number;
	    username?: string;
	    password?: string;
	
	    static createFrom(source: any = {}) {
	        return new ProxyConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.scheme = source["scheme"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.username = source["username"];
	        this.password = source["password"];
	    }
	}
	export class Collection {
	    id: string;
	    name: string;
	    variables: Record<string, string>;
	    globalAuth?: AuthConfig;
	    proxies: ProxyConfig[];
	    activeProxyId?: string;
	    requests: RequestNode[];
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Collection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.variables = source["variables"];
	        this.globalAuth = this.convertValues(source["globalAuth"], AuthConfig);
	        this.proxies = this.convertValues(source["proxies"], ProxyConfig);
	        this.activeProxyId = source["activeProxyId"];
	        this.requests = this.convertValues(source["requests"], RequestNode);
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	

}

