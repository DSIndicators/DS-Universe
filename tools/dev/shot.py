import sys, asyncio
from playwright.async_api import async_playwright
url=sys.argv[1]; out=sys.argv[2]; w=int(sys.argv[3]) if len(sys.argv)>3 else 1600; h=int(sys.argv[4]) if len(sys.argv)>4 else 1000
actions=sys.argv[5] if len(sys.argv)>5 else ''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':w,'height':h}, device_scale_factor=1)
        logs=[]
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: logs.append(f'pageerror: {e}'))
        await pg.goto(url, wait_until='networkidle')
        for a in [x for x in actions.split(';') if x]:
            if a.startswith('wait:'): await pg.wait_for_timeout(int(a[5:]))
            elif a.startswith('click:'): await pg.click(a[6:])
            elif a.startswith('key:'): await pg.keyboard.press(a[4:])
            elif a.startswith('focus:'): await pg.focus(a[6:])
            elif a.startswith('scroll:'): await pg.evaluate(f"document.querySelector('{a[7:]}').scrollIntoView({{block:'center'}})")
            elif a.startswith('hover:'):
                x,y=a[6:].split(','); await pg.mouse.move(int(x),int(y))
            elif a.startswith('js:'): await pg.evaluate(a[3:])
            elif a.startswith('drag:'):
                x1,y1,x2,y2=[int(v) for v in a[5:].split(',')]
                await pg.mouse.move(x1,y1); await pg.mouse.down(); await pg.mouse.move((x1+x2)//2,(y1+y2)//2, steps=6); await pg.mouse.move(x2,y2, steps=6); await pg.mouse.up()
            elif a.startswith('dbl:'):
                x,y=a[4:].split(','); await pg.mouse.dblclick(int(x),int(y))
            elif a.startswith('wheel:'):
                x,y,dy=a[6:].split(','); await pg.mouse.move(int(x),int(y)); await pg.mouse.wheel(0,int(dy))
            elif a.startswith('mclick:'):
                x,y=a[7:].split(','); await pg.mouse.click(int(x),int(y))
            elif a.startswith('box:'):
                bb = await (await pg.query_selector(a[4:])).bounding_box(); print('box', bb)
        sel = '.ds-replay'
        el = await pg.query_selector(sel)
        if el and 'full' not in actions: await el.screenshot(path=out)
        else: await pg.screenshot(path=out, full_page=('full' in actions))
        for l in logs: print(l)
        await b.close()
asyncio.run(main())
