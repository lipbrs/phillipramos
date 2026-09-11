/** @type {import('next').NextConfig} */
export default {
  // O painel e o worker importam o mesmo cliente de banco. `serverExternalPackages`
  // impede o bundler de empacotar o driver nativo do libsql, que so funciona
  // como modulo de verdade do Node.
  serverExternalPackages: ["@libsql/client", "libsql"],
};
