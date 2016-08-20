const commands = {
    added: {
        command: 'added [msg]',
        describe: 'Writes your changelog indicating new stuff.'
    },
    changed: {
        command: 'changed [msg]',
        describe: 'Writes your changelog indicating updated stuff.'
    },
    deprecated: {
        command: 'deprecated [msg]',
        describe: 'Writes your changelog indicating deprecated stuff.'
    },
    fixed: {
        command: 'fixed [msg]',
        describe: 'Writes your changelog indicating fixed stuff.'
    },
    removed: {
        command: 'removed [msg]',
        describe: 'Writes your changelog indicating removed stuff.'
    },
    security: {
        command: 'security [msg]',
        describe: 'Writes your changelog indicating security upgrades.'
    }
};

Object.keys(commands).forEach((type) => {
    const command = Object.assign({}, commands[type], {
        handler(parser, argv, write) {
            if ( !parser.exists() ) {
                throw new Error('CHANGELOG.md does not exists. You can run: chan init in order to create a fresh new one.');
            }
            const msg = argv.msg;
            if (!msg) return null;

            return parser.change(parser.SEPARATORS[type], msg)
                .then(write)
                .catch((e) => {
                    this.log().error(e.message);
                });
        }
    });

    commands[type] = () => command;
});

export default commands;
