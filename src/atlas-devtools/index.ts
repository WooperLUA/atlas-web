import {_If, Button, createStyleMap, Div} from "@atlas-dom";
import {uState, getRefs} from "@atlas";

export const mountAtlasDevtools = () =>
{
    const target = (window as any)._atlas;
    if (!target) return;
    if (!target.devtools)
    {
        target.devtools = {logs: [], states: new Set(), onUpdate: null};
    }

    const localState = uState({isVisible: false});
    const {isVisible} = getRefs(localState);

    const style = createStyleMap({
        '.devtools-wrapper': {
            position:        'fixed', bottom: '10px', right: '10px', width: '350px', height: '400px',
            backgroundColor: '#1e1e1e', color: '#ffffff', fontFamily: 'sans-serif', fontSize: '12px',
            padding:         '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            overflowY:       'auto', zIndex: '99999', transition: 'all 0.2s ease-in-out', border: '1px solid #58f3e5'
        },
        '.hidden':           {
            transform: 'translateY(385px)',
            width : '50px;'
        },
        '.header':           {
            display:      'flex', flexDirection: 'column', gap: '1rem',
            borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '10px', fontWeight: 'bold'
        },
        '.log-list':         {display: 'flex', flexDirection: 'column'},
        '.entry':            {marginBottom: '8px', padding: '4px', backgroundColor: '#2a2a2a', borderRadius: '4px'},
        '.meta':             {color: '#888'},
        '.diff':             {whiteSpace: 'pre-wrap'},
        '.prev':             {color: '#ff6b6b'},
        '.curr':             {color: '#58f3e5'},
        'atlas-log' : {borderRadius : '100%'}
    });

    const logList = Div({className: 'log-list'});

    const updateUI = () =>
    {
        logList.innerHTML = "";
        const invertedLogs = [...target.devtools.logs].reverse();
        invertedLogs.forEach((log: any) =>
        {
            const entry = Div({className: 'entry'},
                Div({className: 'meta'}, `[${log.stateName}].${String(log.prop)}`),
                Div({className: 'diff'},
                    Div({className: 'curr'}, `Current : ${JSON.stringify(log.newValue)}`),
                    Div({className: 'prev'}, `Previous : ${JSON.stringify(log.oldValue)}`)
                )
            );
            logList.appendChild(entry);
        });
    };

    target.devtools.onUpdate = updateUI;
    updateUI();


    return Div({className: style},
        Div({className: () => `devtools-wrapper ${isVisible() ? '' : 'hidden'}`},
            Div({className: 'header'},
                Button({
                    style:       {width: '100%'},
                    textContent: () => isVisible() ? 'v' : '🌍',
                    onClick:     () => localState.isVisible = !localState.isVisible
                }),
                "Atlas Devtools",
            ),
            _If(() => isVisible(), logList)
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