import { createContext, useContext, useState, type ReactNode } from 'react';
export type Route = { area: string; sub: string };
export type EditorTarget = { route: Route; selections: Record<string, string> };
const Navigation = createContext<{ route: Route; go: (route: Route) => void; jump: (route: Route, key: string, id: string) => void; locate: (target: EditorTarget) => void; back: () => void; canBack: boolean; backLabel: string; selections: Record<string, string>; select: (key: string, id: string) => void } | null>(null);
export function EditorNavigation({ children }: { children: ReactNode }) {
  const [route, go] = useState<Route>({ area: 'achievements', sub: 'levels' });
  const [history, setHistory] = useState<{ route: Route; selections: Record<string, string> }[]>([]), [selections, setSelections] = useState<Record<string, string>>({});
  const select = (key: string, id: string) => setSelections(s => ({ ...s, [key]: id }));
  const locate = (target: EditorTarget) => { setHistory(h => [...h, {route, selections}]); setSelections(s => ({ ...s, ...target.selections, ['mobile:' + target.route.area + '/' + target.route.sub]: 'detail' })); go(target.route); };
  return <Navigation.Provider value={{ route, go, selections, select, locate, canBack: !!history.length, backLabel: history[history.length - 1]?.route.sub === 'graph' ? '← 返回关联图' : '← 返回原编辑位置',
    jump: (next, key, id) => locate({route: next, selections: {[key]:id}}),
    back: () => { const last = history[history.length - 1]; if (last) { go(last.route); setSelections(last.selections); setHistory(h => h.slice(0, -1)); } } }}>{children}</Navigation.Provider>;
}
export function useNavigation() { return useContext(Navigation); }
export function useSelection(key: string, initial = ''): [string, (id: string) => void] {
  const nav = useNavigation(); const [local, setLocal] = useState(initial);
  return [nav?.selections[key] ?? local, id => { setLocal(id); nav?.select(key, id); }];
}
