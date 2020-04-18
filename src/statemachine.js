const getNextState = (config, state, event) => {
  const currentState = config.states[state];
  const eventName = event.type || event;
  return typeof currentState.on[eventName] === "string"
    ? currentState.on[eventName]
    : currentState.on[eventName].target;
};

const runActions = (context, event, actions, options) => {
  if (!actions || !actions.length) {
    return context;
  }

  return actions.reduce((ctx, action) => {
    const foundAction = options.actions[action] ?? action;

    if (foundAction.type === "assignment") {
      return {
        ...ctx,
        ...Object.fromEntries(
          Object.entries(foundAction.assignment).map(([key, value]) => [
            [key],
            value(ctx, event)
          ])
        )
      };
    } else if (typeof foundAction === "function") {
      foundAction(ctx, event);
    } else {
      console.warn("action could not be found", action);
    }

    return ctx;
  }, context);
};

export const assign = assignment => ({
  type: "assignment",
  assignment
});

export const createMachine = function(config, options) {
  return {
    config,

    initialState: {
      value: config.initial,
      context: config.context || {},
      matches(state) {
        return this.value.includes(state);
      }
    },

    _options: options,

    // actions
    transition: (state, event) => {
      const eventName = event.type || event;

      try {
        return getNextState(config, state, event) || state;
      } catch (e) {
        console.warn(
          `${eventName} was passed, but no matching event can be found in its current state. ${state}`
        );
        return null;
      }
    }
  };
};

export const interpret = function({
  config,
  initialState,
  _options,
  transition
}) {
  const subscriptions = {
    all: [],
    add(cb) {
      return this.all.push(cb) - 1;
    },
    run(state) {
      this.all.forEach(cb => cb && cb(state));
    },
    remove(marker) {
      this.all.splice(marker, 1, null);
    }
  };

  return {
    state: null,
    status: 0,
    _machine: {
      // passed in machine
      config,
      initialState,
      _options,
      transition
    },

    // context: config.context, // initial context for now
    send(event) {
      if (!this.status) {
        return console.warn("This machine is currently stopped");
      }

      // previous states exist actions
      const previousStateName = this.state.value;
      const previousState = this._machine.config.states[previousStateName];
      const nextStateName = transition(previousStateName, event);
      const nextState = this._machine.config.states[nextStateName];
      const eventName = event.type || event;

      if (!nextStateName) {
        return console.warn("Could not find the next state");
      }

      // Run Exit Hooks
      this.state.context = runActions(
        this.state.context,
        event,
        previousState.exit,
        this._machine._options
      );

      // Run On Hooks
      this.state.context = runActions(
        this.state.context,
        event,
        previousState.on[eventName].actions,
        this._machine._options
      );

      // Run Entry Hooks
      this.state.context = runActions(
        this.state.context,
        event,
        nextState.entry,
        this._machine._options
      );

      // Update current state
      this.state.value = nextStateName;

      // Run userlan subscriptions
      subscriptions.run(this.state);
    },

    start() {
      this.status = 1;
      this.state = Object.assign({}, this._machine.initialState);
      return this;
    },

    stop() {
      this.status = 0;
      return this;
    },

    subscribe(callback) {
      const marker = subscriptions.add(callback);
      return () => subscriptions.remove(marker);
    }
  };
};
