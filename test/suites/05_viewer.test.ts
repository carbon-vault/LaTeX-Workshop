import * as vscode from 'vscode'
import * as path from 'path'
import * as lw from '../../src/lw'
import * as test from './utils'
import { BuildDone } from '../../src/components/eventbus'

suite('PDF viewer test suite', () => {
    test.suite.name = path.basename(__filename).replace('.test.js', '')
    test.suite.fixture = 'testground'

    suiteSetup(async () => {
        await vscode.commands.executeCommand('latex-workshop.activate')
        await vscode.workspace.getConfiguration('latex-workshop').update('latex.autoBuild.run', 'never')
    })

    teardown(async () => {
        await test.reset()

        await vscode.workspace.getConfiguration().update('latex-workshop.latex.outDir', undefined)
        await vscode.workspace.getConfiguration().update('latex-workshop.view.pdf.viewer', undefined)
        await vscode.workspace.getConfiguration().update('latex-workshop.latex.rootFile.useSubFile', undefined)
        await vscode.workspace.getConfiguration().update('latex-workshop.latex.rootFile.doNotPrompt', undefined)
        await vscode.workspace.getConfiguration().update('latex-workshop.synctex.afterBuild.enabled', undefined)
    })

    test.run('basic build and view', async (fixture: string) => {
        await test.load(fixture, [
            {src: 'base.tex', dst: 'main.tex'}
        ], {skipCache: true})

        await test.build(fixture, 'main.tex')
        await test.view(fixture, 'main.pdf')
    })

    test.run('build main.tex and view it', async (fixture: string) => {
        await vscode.workspace.getConfiguration().update('latex-workshop.latex.rootFile.doNotPrompt', true)
        await vscode.workspace.getConfiguration().update('latex-workshop.latex.rootFile.useSubFile', false)
        await test.load(fixture, [
            {src: 'subfile_base.tex', dst: 'main.tex'},
            {src: 'subfile_sub.tex', dst: 'sub/s.tex'}
        ], {local: 1, skipCache: true})

        await test.build(fixture, 'sub/s.tex')
        await test.view(fixture, 'main.pdf')
    })

    test.run('build a subfile and view it', async (fixture: string) => {
        await vscode.workspace.getConfiguration().update('latex-workshop.latex.rootFile.doNotPrompt', true)
        await vscode.workspace.getConfiguration().update('latex-workshop.latex.rootFile.useSubFile', true)
        await test.load(fixture, [
            {src: 'subfile_base.tex', dst: 'main.tex'},
            {src: 'subfile_sub.tex', dst: 'sub/s.tex'}
        ], {local: 1, skipCache: true})

        await test.build(fixture, 'sub/s.tex')
        await test.view(fixture, 'sub/s.pdf')
    })

    test.run('build main.tex with QuickPick and view it', async (fixture: string) => {
        await vscode.workspace.getConfiguration('latex-workshop').update('latex.rootFile.doNotPrompt', false)
        await test.load(fixture, [
            {src: 'subfile_base.tex', dst: 'main.tex'},
            {src: 'subfile_sub.tex', dst: 'sub/s.tex'}
        ], {local: 1, skipCache: true})

        await test.build(fixture, 'sub/s.tex', undefined, async () => {
            const event = test.wait(BuildDone)
            void lw.commander.build()
            await test.sleep(500)
            await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem')
            await event
        })
        await test.view(fixture, 'main.pdf', async () => {
            await test.sleep(500)
            await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem')
        })
    })

    test.run('build s.tex with QuickPick and view it', async (fixture: string) => {
        await vscode.workspace.getConfiguration('latex-workshop').update('latex.rootFile.doNotPrompt', false)
        await test.load(fixture, [
            {src: 'subfile_base.tex', dst: 'main.tex'},
            {src: 'subfile_sub.tex', dst: 'sub/s.tex'}
        ], {local: 1, skipCache: true})

        await test.build(fixture, 'sub/s.tex', undefined, async () => {
            const event = test.wait(BuildDone)
            void lw.commander.build()
            await test.sleep(500)
            await vscode.commands.executeCommand('workbench.action.quickOpenSelectNext')
            await test.sleep(250)
            await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem')
            await event
        })
        await test.view(fixture, 'sub/s.pdf', async () => {
            await test.sleep(500)
            await vscode.commands.executeCommand('workbench.action.quickOpenSelectNext')
            await test.sleep(250)
            await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem')
        })
    })

    test.run('build with outDir and view it', async (fixture: string) => {
        await vscode.workspace.getConfiguration('latex-workshop').update('latex.outDir', './out')
        await test.load(fixture, [
            {src: 'base.tex', dst: 'main.tex'}
        ], {skipCache: true})

        await test.build(fixture, 'main.tex')
        await test.view(fixture, 'out/main.pdf')
    })
})
