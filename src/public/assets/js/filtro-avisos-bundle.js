(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    (function (global){(function (){
    "use strict";const t="Content-Type",e=Symbol(),r=Symbol();function o(e={}){var r;return null===(r=Object.entries(e).find((([e])=>e.toLowerCase()===t.toLowerCase())))||void 0===r?void 0:r[1]}function s(t){return/^application\/.*json.*/.test(t)}const n=function(t,e,r=0){return Object.entries(e).reduce(((e,[o,s])=>{const i=t[o];return Array.isArray(i)&&Array.isArray(s)?e[o]=r?[...i,...s]:s:e[o]="object"==typeof i&&"object"==typeof s?n(i,s,r):s,e}),{...t})},i={options:{},errorType:"text",polyfills:{},polyfill(t,e=1,r=0,...o){const s=this.polyfills[t]||("undefined"!=typeof self?self[t]:null)||("undefined"!=typeof global?global[t]:null);if(e&&!s)throw new Error(t+" is not defined");return r&&s?new s(...o):s}};class h extends Error{}const u=t=>{const o=Object.create(null);t=t._addons.reduce(((e,r)=>r.beforeRequest&&r.beforeRequest(e,t._options,o)||e),t);const{_url:s,_options:i,_config:u,_catchers:c,_resolvers:l,_middlewares:a,_addons:d}=t,f=new Map(c),p=n(u.options,i);let _=s;const y=(t=>e=>t.reduceRight(((t,e)=>e(t)),e)||e)(a)(((t,e)=>(_=t,u.polyfill("fetch")(t,e))))(s,p),b=new Error,w=y.catch((t=>{throw{[e]:t}})).then((t=>{if(!t.ok){const e=new h;if(e.cause=b,e.stack=e.stack+"\nCAUSE: "+b.stack,e.response=t,e.url=_,"opaque"===t.type)throw e;return t.text().then((r=>{var o;if(e.message=r,"json"===u.errorType||"application/json"===(null===(o=t.headers.get("Content-Type"))||void 0===o?void 0:o.split(";")[0]))try{e.json=JSON.parse(r)}catch(t){}throw e.text=r,e.status=t.status,e}))}return t})),g=o=>s=>(o?w.then((t=>t&&t[o]())).then((t=>s?s(t):t)):w.then((t=>s?s(t):t))).catch((o=>{const s=o.hasOwnProperty(e),n=s?o[e]:o,i=(null==n?void 0:n.status)&&f.get(n.status)||f.get(null==n?void 0:n.name)||s&&f.has(e)&&f.get(e);if(i)return i(n,t);const h=f.get(r);if(h)return h(n,t);throw n})),j={_wretchReq:t,_fetchReq:y,_sharedState:o,res:g(null),json:g("json"),blob:g("blob"),formData:g("formData"),arrayBuffer:g("arrayBuffer"),text:g("text"),error(t,e){return f.set(t,e),this},badRequest(t){return this.error(400,t)},unauthorized(t){return this.error(401,t)},forbidden(t){return this.error(403,t)},notFound(t){return this.error(404,t)},timeout(t){return this.error(408,t)},internalError(t){return this.error(500,t)},fetchError(t){return this.error(e,t)}},m=d.reduce(((t,e)=>({...t,..."function"==typeof e.resolver?e.resolver(t):e.resolver})),j);return l.reduce(((e,r)=>r(e,t)),m)},c={_url:"",_options:{},_config:i,_catchers:new Map,_resolvers:[],_deferred:[],_middlewares:[],_addons:[],addon(t){return{...this,_addons:[...this._addons,t],...t.wretch}},errorType(t){return{...this,_config:{...this._config,errorType:t}}},polyfills(t,e=0){return{...this,_config:{...this._config,polyfills:e?t:n(this._config.polyfills,t)}}},url(t,e=0){if(e)return{...this,_url:t};const r=this._url.split("?");return{...this,_url:r.length>1?r[0]+t+"?"+r[1]:this._url+t}},options(t,e=0){return{...this,_options:e?t:n(this._options,t)}},headers(t){const e=t?Array.isArray(t)?Object.fromEntries(t):"entries"in t?Object.fromEntries(t.entries()):t:{};return{...this,_options:n(this._options,{headers:e})}},accept(t){return this.headers({Accept:t})},content(e){return this.headers({[t]:e})},auth(t){return this.headers({Authorization:t})},catcher(t,e){const r=new Map(this._catchers);return r.set(t,e),{...this,_catchers:r}},catcherFallback(t){return this.catcher(r,t)},resolve(t,e=0){return{...this,_resolvers:e?[t]:[...this._resolvers,t]}},defer(t,e=0){return{...this,_deferred:e?[t]:[...this._deferred,t]}},middlewares(t,e=0){return{...this,_middlewares:e?t:[...this._middlewares,...t]}},fetch(t=this._options.method,e="",r=null){let n=this.url(e).options({method:t});const i=o(n._options.headers),h="object"==typeof r&&(!n._options.headers||!i||s(i));return n=r?h?n.json(r,i):n.body(r):n,u(n._deferred.reduce(((t,e)=>e(t,t._url,t._options)),n))},get(t=""){return this.fetch("GET",t)},delete(t=""){return this.fetch("DELETE",t)},put(t,e=""){return this.fetch("PUT",e,t)},post(t,e=""){return this.fetch("POST",e,t)},patch(t,e=""){return this.fetch("PATCH",e,t)},head(t=""){return this.fetch("HEAD",t)},opts(t=""){return this.fetch("OPTIONS",t)},body(t){return{...this,_options:{...this._options,body:t}}},json(t,e){const r=o(this._options.headers);return this.content(e||s(r)&&r||"application/json").body(JSON.stringify(t))}};function l(t="",e={}){return{...c,_url:t,_options:e}}l.default=l,l.options=function(t,e=0){i.options=e?t:n(i.options,t)},l.errorType=function(t){i.errorType=t},l.polyfills=function(t,e=0){i.polyfills=e?t:n(i.polyfills,t)},l.WretchError=h,module.exports=l;
    
    
    }).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    },{}],2:[function(require,module,exports){
    const wretch = require('wretch');
    
    const endpoint = wretch(document.URL);
    
    window.addEventListener('DOMContentLoaded', event => {
        let tabla = $('#datatable').DataTable({
            "language": {
                "sProcessing":    "Procesando...",
                "sLengthMenu":    "Mostrar _MENU_ entradas",
                "sZeroRecords":   "No se encontraron resultados",
                "sEmptyTable":    "Ningún dato disponible en esta tabla",
                "sInfo":          "Mostrando entradas de la _START_ a la _END_ de un total de _TOTAL_ entradas",
                "sInfoEmpty":     "No hay entradas disponibles",
                "sInfoFiltered":  "(filtrado de un total de _MAX_ entradas)",
                "sInfoPostFix":   "",
                "sSearch":        "Buscar: ",
                "sUrl":           "",
                "sInfoThousands":  ",",
                "sLoadingRecords": "Cargando...",
                "oPaginate": {
                    "sFirst":    "Primero",
                    "sLast":    "Último",
                    "sNext":    "Siguiente",
                    "sPrevious": "Anterior"
                },
                "oAria": {
                    "sSortAscending":  ": Activar para ordenar la columna de manera ascendente",
                    "sSortDescending": ": Activar para ordenar la columna de manera descendente"
                }
            }
        });
    
        const fecha_inicio = document.getElementById('date-filter-desde');
        const fecha_fin = document.getElementById('date-filter-hasta');
        const form_avisos = document.getElementById('form_avisos');
        let feedback_carga = document.getElementById('mensaje_carga');

        let intervalo = {min: fecha_inicio.value, inicio: fecha_inicio.value, fin: fecha_fin.value, max: fecha_fin.value};
    
        fecha_inicio.addEventListener('change', async (fecha_event) => {
            let ini = fecha_inicio.value;
            
            await new Promise(resolve => setTimeout(resolve, 500)) // Esperar a otros cambios en los siguientes 500ms
            if (ini != fecha_inicio.value) return; // Si se ha vuelto a cambiar, no seguir
            
            if (ini < intervalo.min) { // Se amplia intervalo
                // Pedir datos de asistencias de la fecha a app, desde el mínimo nuevo al mínimo anterior
                feedback_carga.style.display = "block";
                let new_content = (await endpoint.post({ tipo:'filtroFecha', fecha: ini, fecha_max: intervalo.min })
                    .res(async response => { 
                        return (response.headers.get('Content-Type').includes('application/json')) ? response.json() : response.text();
                    })).asistencias;
                intervalo.min = ini;
                feedback_carga.style.display = "none";
                for (let i = 0; i < new_content.length; i++) {
                    let asist = new_content[i];
                    let clases = asist.clase[0];
                    if (asist.motivo == null) asist.motivo = ''; // asist.clase es un array de todas las clases que pueden ser, no sé si eso cambia algo. No
                    for (let j = 1; j < asist.clase.length; j++) {clases += ', ' + asist.clase[j]}
                    tabla.row.add([asist.fecha, asist.hora, clases, asist.docente]);
                }
                tabla.draw(false);
            }
            else if (ini >= intervalo.min && ini <= intervalo.fin && ini != intervalo.inicio) {
                tabla.search((val, val1) => {
                    let ISOdate = val1[0].split('/').reverse().join('-');
                    return ISOdate >= ini && ISOdate <= intervalo.fin;
                });
                tabla.draw(true);
            }
            intervalo.inicio = ini;
        });
    
        fecha_fin.addEventListener('change', async (fecha_event) => {
            let fin = fecha_fin.value;
            
            await new Promise(resolve => setTimeout(resolve, 500)) // Esperar a otros cambios en los siguientes 500ms
            if (fin != fecha_fin.value) return; // Si se ha vuelto a cambiar, no seguir

            if (fin > intervalo.max) { // Se amplia intervalo
                // Pedir datos de asistencias de la fecha a app, desde el máximo anterior hasta el máximo nuevo
                feedback_carga.style.display = "block";
                let new_content = (await endpoint.post({ tipo:'filtroFecha', fecha: intervalo.max, fecha_max: fin })
                    .res(async response => { 
                        return (response.headers.get('Content-Type').includes('application/json')) ? response.json() : response.text();
                    })).asistencias;
                intervalo.max = fin;
                feedback_carga.style.display = "none";
                for (let i = 0; i < new_content.length; i++) {
                    let asist = new_content[i];
                    let clases = asist.clase[0];
                    if (asist.motivo == null) asist.motivo = ''; // asist.clase es un array de todas las clases asociadas a una asistencia
                    for (let j = 1; j < asist.clase.length; j++) {clases += ', ' + asist.clase[j]}
                    tabla.row.add([asist.fecha, asist.hora, clases, asist.docente]);
                }
                tabla.draw(false);
            }
            else if (fin <= intervalo.max && fin >= intervalo.inicio && fin != intervalo.fin) {
                tabla.search((val, val1) => {
                    let ISOdate = val1[0].split('/').reverse().join('-');
                    return ISOdate <= fin && ISOdate >= intervalo.inicio;
                });
                tabla.draw(true);
            }
            intervalo.fin = fin;
        });

        form_avisos.addEventListener('submit', async (submit_event) => {
            submit_event.preventDefault();

            let input_tipo = document.createElement("input");
            input_tipo.type = "hidden";
            input_tipo.name = "tipo";
            input_tipo.value = "avisos"
            
            let input_inicio = document.createElement("input");
            input_inicio.type = "hidden";
            input_inicio.name = "fecha_min";
            input_inicio.value = fecha_inicio.value;

            let input_fin = document.createElement("input");
            input_fin.type = "hidden";
            input_fin.name = "fecha_max";
            input_fin.value = fecha_fin.value;

            form_avisos.appendChild(input_tipo);
            form_avisos.appendChild(input_inicio);
            form_avisos.appendChild(input_fin);

            form_avisos.submit();
            
            form_avisos.removeChild(form_avisos.lastChild());
            form_avisos.removeChild(form_avisos.lastChild());
            form_avisos.removeChild(form_avisos.lastChild());
            
        });
    })
    },{"wretch":1}]},{},[2]);