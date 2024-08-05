const server = Bun.serve({
  port: 8000,
  fetch(request) {
    return new Response('Welcome to Bun!')
  },
})
console.log(`Listening on localhost:${server.port}`)
