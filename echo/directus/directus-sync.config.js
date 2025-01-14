module.exports = {
  // this is assuming we are in the dev container. which means that
  // this NEEDS to be done after the build is complete
  // OR needs to be run in the same container as the directus server
  directusUrl: process.env.PUBLIC_URL || 'http://directus:8055',
  directusEmail: process.env.ADMIN_EMAIL || 'admin@dembrane.com',
  directusPassword: process.env.ADMIN_PASSWORD || 'admin',
  dumpPath: './sync',
  preserveIds: ['roles', 'policies', 'dashboards', 'panels'],
  hooks: {
    flows: {
      onDump: (flows) => {
        return flows.map((flow) => {
          flow.name = `🧊 ${flow.name}`;
          return flow;
        });
      },
      onSave: (flows) => {
        return flows.map((flow) => {
          flow.name = `🔥 ${flow.name}`;
          return flow;
        });
      },
      onLoad: (flows) => {
        return flows.map((flow) => {
          flow.name = flow.name.replace('🔥 ', '');
          return flow;
        });
      },
    },
  },
};
