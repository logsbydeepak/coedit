package coedit_proxy

import (
	"bytes"
	"fmt"
	"net/http"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"
)

func init() {
	caddy.RegisterModule(Middleware{})
	httpcaddyfile.RegisterHandlerDirective("coedit_proxy", parseCaddyfile)
}

type Middleware struct {
}

func (Middleware) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "http.handlers.coedit_proxy",
		New: func() caddy.Module { return new(Middleware) },
	}
}

func (m Middleware) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	fmt.Println(r.Host)

	var proxyURL bytes.Buffer
	if r.Host == "abc-abc-app.localhost" {
		proxyURL.WriteString("127.0.0.1:5002")
	} else {
		proxyURL.WriteString("not_found")
	}

	caddyhttp.SetVar(r.Context(), "shard.upstream", proxyURL)
	return next.ServeHTTP(w, r)
}

func parseCaddyfile(h httpcaddyfile.Helper) (caddyhttp.MiddlewareHandler, error) {
	var m Middleware
	return m, nil
}
