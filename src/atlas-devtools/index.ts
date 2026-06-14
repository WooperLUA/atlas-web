import {_If, Button, createStyleMap, Div, Span} from "@atlas-dom";
import {uState, getRefs} from "@atlas";

const safeStringify = (obj: any, limit = 300) =>
{
    try
    {
        const str = JSON.stringify(obj, null, 2);
        return str.length > limit ? str.slice(0, limit) + '\n... (truncated)' : str;
    }
    catch
    {
        return '[Circular or Unserializable]';
    }
};

export const mountAtlasDevtools = () =>
{
    const target = (window as any)._atlas;
    if (!target) return;

    if (!target.devtools)
    {
        target.devtools = {logs: [], states: new Set(), onUpdate: null};
    }

    const localState = uState({
        isVisible:      false,
        activeTab:      'states' as 'states' | 'queries',
        expandedStates: new Set<string>()
    });
    const {isVisible, activeTab, expandedStates} = getRefs(localState);

    const style = createStyleMap({
        '.devtools-wrapper':   {
            position:        'fixed', bottom: '10px', right: '10px', width: '400px', height: '500px',
            backgroundColor: '#1e1e1e', color: '#ffffff', fontFamily: 'monospace', fontSize: '12px',
            padding:         '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            overflow:        'hidden', zIndex: '99999', transition: 'all 0.2s ease-in-out', border: '1px solid #58f3e5',
            display:         'flex', flexDirection: 'column'
        },
        '.hidden':             {
            transform: 'translateY(485px)',
            width:     '50px'
        },
        '.header':             {
            display:      'flex', flexDirection: 'column', gap: '0.5rem',
            borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px'
        },
        '.tabs':               {display: 'flex', gap: '0.5rem'},
        '.tab-btn':            {
            flex:   '1', padding: '6px', background: '#2a2a2a', border: '1px solid #333', color: '#888',
            cursor: 'pointer', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', transition: 'all 0.1s'
        },
        '.tab-btn:hover':      {background: '#333', color: '#fff'},
        '.tab-btn.active':     {background: '#58f3e5', color: '#1e1e1e', borderColor: '#58f3e5'},
        '.content-area':       {flex: '1', overflowY: 'auto', paddingRight: '5px'},
        '.log-list':           {display: 'flex', flexDirection: 'column', gap: '8px'},
        '.state-group':        {
            border:          '1px solid #333',
            borderRadius:    '4px',
            overflow:        'hidden',
            backgroundColor: '#252525'
        },
        '.state-header':       {
            padding:        '8px', backgroundColor: '#2a2a2a', cursor: 'pointer', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333'
        },
        '.state-header:hover': {backgroundColor: '#333'},
        '.state-name':         {color: '#58f3e5', fontWeight: 'bold', fontSize: '11px'},
        '.state-preview':      {
            color:        '#888',
            fontSize:     '10px',
            maxWidth:     '200px',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap'
        },
        '.state-logs':         {
            padding:         '8px',
            display:         'flex',
            flexDirection:   'column',
            gap:             '6px',
            backgroundColor: '#1e1e1e'
        },
        '.log-entry':          {
            padding:         '6px',
            backgroundColor: '#2a2a2a',
            borderRadius:    '4px',
            borderLeft:      '2px solid #58f3e5'
        },
        '.log-meta':           {
            color:          '#888',
            fontSize:       '10px',
            marginBottom:   '4px',
            display:        'flex',
            justifyContent: 'space-between'
        },
        '.log-diff':           {whiteSpace: 'pre-wrap', fontSize: '10px', lineHeight: '1.4'},
        '.log-prev':           {color: '#ff6b6b', marginBottom: '2px'},
        '.log-curr':           {color: '#58f3e5'},
        '.query-entry':        {
            padding:         '8px',
            backgroundColor: '#2a2a2a',
            borderRadius:    '4px',
            borderLeft:      '2px solid #f3e558'
        },
        '.query-name':         {color: '#f3e558', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px'}
    });

    const contentContainer = Div({className: 'content-area'});

    const renderStates = () =>
    {
        const container = Div({className: 'log-list'});

        if (target.devtools.states.size === 0)
        {
            container.appendChild(Div({
                className: 'state-header',
                style:     'justify-content: center; color: #888;'
            }, 'No states registered yet.'));
            return container;
        }

        const logsByState = new Map<string, any[]>();
        target.devtools.logs.forEach((log: any) =>
        {
            if (log.logType !== 'query')
            {
                const logs = logsByState.get(log.stateName) || [];
                logs.push(log);
                logsByState.set(log.stateName, logs);
            }
        });

        target.devtools.states.forEach((stateObj: any) =>
        {
            if (stateObj.__atlas_type === 'query') return;

            const name = stateObj.__atlas_name || 'Unknown State';
            const isExpanded = expandedStates().has(name);
            const logs = logsByState.get(name) || [];
            const preview = safeStringify(stateObj, 50).replace(/\n/g, ' ');

            const header = Div({
                    className: 'state-header',
                    onClick:   () =>
                               {
                                   const newSet = new Set(expandedStates());
                                   if (isExpanded) newSet.delete(name);
                                   else newSet.add(name);
                                   localState.expandedStates = newSet;
                               }
                },
                Div({className: 'state-name'}, `📦 ${name}`),
                Div({className: 'state-preview'}, preview)
            );

            const logsContainer = Div({className: 'state-logs'});
            if (logs.length === 0)
            {
                logsContainer.appendChild(Div({style: 'color: #666; font-size: 10px; text-align: center;'}, 'No mutations yet.'));
            }
            else
            {
                // Show newest logs first
                [...logs].reverse().forEach((log: any) =>
                {
                    logsContainer.appendChild(Div({className: 'log-entry'},
                        Div({className: 'log-meta'},
                            Span({textContent: `.${String(log.prop)}`}),
                            Span({textContent: new Date(log.time).toLocaleTimeString()})
                        ),
                        Div({className: 'log-diff'},
                            Div({className: 'log-curr'}, `+ ${safeStringify(log.newValue, 150)}`),
                            Div({className: 'log-prev'}, `- ${safeStringify(log.oldValue, 150)}`)
                        )
                    ));
                });
            }

            const group = Div({className: 'state-group'},
                header,
                _If(() => isExpanded, logsContainer)
            );
            container.appendChild(group);
        });
        return container;
    };

    const renderQueries = () =>
    {
        const container = Div({className: 'log-list'});
        const queryLogs = target.devtools.logs.filter((log: any) => log.logType === 'query');

        if (queryLogs.length === 0)
        {
            container.appendChild(Div({
                className: 'state-header',
                style:     'justify-content: center; color: #888;'
            }, 'No network queries yet.'));
            return container;
        }

        [...queryLogs].reverse().forEach((log: any) =>
        {
            container.appendChild(Div({className: 'query-entry'},
                Div({className: 'query-name'}, `🌐 ${log.stateName}`),
                Div({className: 'log-meta'},
                    Span({textContent: `.${String(log.prop)}`}),
                    Span({textContent: new Date(log.time).toLocaleTimeString()})
                ),
                Div({className: 'log-diff'},
                    Div({className: 'log-curr'}, `+ ${safeStringify(log.newValue, 200)}`),
                    Div({className: 'log-prev'}, `- ${safeStringify(log.oldValue, 200)}`)
                )
            ));
        });
        return container;
    };

    const updateUI = () =>
    {
        contentContainer.innerHTML = '';
        if (activeTab() === 'states')
        {
            contentContainer.appendChild(renderStates());
        }
        else
        {
            contentContainer.appendChild(renderQueries());
        }
    };

    target.devtools.onUpdate = updateUI;

    const tabs = Div({className: 'tabs'},
        Button({
            className:   () => `tab-btn ${activeTab() === 'states' ? 'active' : ''}`,
            textContent: 'States (Atlas)',
            onClick:     () => localState.activeTab = 'states'
        }),
        Button({
            className:   () => `tab-btn ${activeTab() === 'queries' ? 'active' : ''}`,
            textContent: 'Network (Query)',
            onClick:     () => localState.activeTab = 'queries'
        }),
        Button({
            className:   'tab-btn',
            textContent: 'Clear All',
            onClick:     () =>
                         {
                             target.devtools.logs = [];
                             updateUI();
                         }
        })
    );

    return Div({className: style},
        Div({className: () => `devtools-wrapper ${isVisible() ? '' : 'hidden'}`},
            Div({className: 'header'},
                Div({style: 'display: flex; align-items: center; gap: 0.5rem; width: 100%;'},
                    Button({
                        style:       {
                            width:          '28px',
                            height:         '28px',
                            padding:        '0',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            borderRadius:   '4px'
                        },
                        textContent: () => isVisible() ? '▼' : '🌍',
                        onClick:     () => localState.isVisible = !localState.isVisible
                    }),
                    _If(() => isVisible(),
                        Span({
                            textContent: 'Atlas Devtools',
                            style:       'flex: 1; font-size: 12px; font-weight: bold; color: #58f3e5;'
                        })
                    )
                ),
                tabs
            ),
            _If(() => isVisible(), contentContainer)
        )
    );
};

if (document.body)
{
    document.body.appendChild(mountAtlasDevtools());
}
else
{
    window.addEventListener('DOMContentLoaded', () =>
    {
        document.body.appendChild(mountAtlasDevtools());
    });
}