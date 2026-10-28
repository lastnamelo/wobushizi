const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function loadModule(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    exports: module.exports,
    module,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: file });
  return module.exports;
}

const { formatAuthError } = loadModule("lib/authErrors.ts");
const flush = () => new Promise((resolve) => setImmediate(resolve));

function mountAuth({ redirectError = null, user = null, userError = null, sendError = null } = {}) {
  const states = [];
  let effect;
  let listener;
  let calls = [];
  const auth = {
    async initialize() { calls.push("initialize"); return { error: redirectError }; },
    async getUser() { calls.push("getUser"); return { data: { user }, error: userError }; },
    onAuthStateChange(callback) {
      listener = callback;
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signInWithOtp() {
      if (sendError) throw sendError;
      return { error: null };
    },
  };
  const { useSupabaseAuth } = loadModule("lib/useSupabaseAuth.ts", {
    react: {
      useState(initial) {
        const index = states.length;
        states.push(initial);
        return [initial, (value) => { states[index] = value; }];
      },
      useEffect(callback) { effect = callback; },
    },
    "@/lib/supabaseClient": { isSupabaseConfigured: true, supabase: { auth } },
    "@/lib/authErrors": { formatAuthError },
  });
  const hook = useSupabaseAuth();
  const unmount = effect();
  return { hook, states, calls, unmount, emit: (...args) => listener(...args) };
}

test("an expired-link redirect remains visible even when getUser only reports a missing session", async () => {
  const app = mountAuth({
    redirectError: { message: "Email link is invalid or has expired", details: { code: "otp_expired" } },
    userError: { message: "Auth session missing!" },
  });
  await flush();
  assert.deepEqual(app.calls, ["initialize", "getUser"]);
  assert.equal(app.states[0], null);
  assert.equal(app.states[1], false);
  assert.match(app.states[2], /expired or has already been used/);
});

test("a valid saved session still signs in after a failed/reused link", async () => {
  const user = { id: "test-user" };
  const app = mountAuth({ redirectError: { message: "Email link is invalid or has expired" }, user });
  await flush();
  assert.equal(app.states[0], user);
  assert.equal(app.states[1], false);
  assert.equal(app.states[2], null);
});

test("an ordinary signed-out visit does not show a false login error", async () => {
  const app = mountAuth({ userError: { message: "Auth session missing!" } });
  await flush();
  assert.equal(app.states[1], false);
  assert.equal(app.states[2], null);
});

test("a successful sign-in event clears the previous redirect failure", async () => {
  const app = mountAuth({ redirectError: { code: "otp_expired" } });
  await flush();
  const user = { id: "test-user" };
  app.emit("SIGNED_IN", { user });
  assert.equal(app.states[0], user);
  assert.equal(app.states[2], null);
});

test("unexpected email request failures get a visible, useful error", async () => {
  const app = mountAuth({ sendError: new Error("Failed to fetch") });
  await flush();
  await assert.rejects(app.hook.signInWithEmail("test@example.com"), /Failed to fetch/);
  assert.match(app.states[2], /Could not reach the sign-in service/);
});

test("an unmounted auth check cannot update component state", async () => {
  const app = mountAuth({ user: { id: "test-user" } });
  app.unmount();
  await flush();
  app.emit("SIGNED_IN", { user: { id: "another-user" } });
  assert.equal(app.states[0], null);
  assert.equal(app.states[1], true);
});
