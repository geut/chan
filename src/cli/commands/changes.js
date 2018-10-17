import change from '../../api/change';


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
        builder(yargs) {
            return yargs.option('g', {
                alias: 'group',
                describe: 'Prefix change with [<group>]. This allow to group changes on release.',
                type: 'string'
            });
        },
        handler(parserInstance, argv, write) {
            if ( !parserInstance.exists() ) {
                throw new Error('CHANGELOG.md does not exists. You can run: chan init in order to create a fresh new one.');
            }

            let result;
            if (argv.msg) {
                result = Promise.resolve(argv.msg);
            } else {
                result = this.openInEditor();
            }

            return result
                .then((msg) => {
                    if (!msg || msg.length === 0) {
                        return null;
                    }
                    
                    return change({ type, msg, parserInstance, write, group: argv.group });
                })
                .catch((e) => {
                    this.log().error(e.message);
                });
        }
    });

    commands[type] = () => command;
});

export default commands;
