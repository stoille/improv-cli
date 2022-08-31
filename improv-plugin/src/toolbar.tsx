import * as React from 'react'
import { Menu, MenuItem, MenuDivider } from '@blueprintjs/core'

import { Editor, Tools } from 'babylonjs-editor'

import { LGraph, LiteGraph } from 'litegraph.js'
import { generateGraphDataObjects } from './scriptParser'
import { generateGraphDataObjects } from './graphScriptParser'

export interface IToolbarProps {
  /**
   * Defines the reference to the editor.
   */
  editor: Editor
}

export class Toolbar extends React.Component<IToolbarProps> {
  /**
   * Renders the component.
   */
  public render(): React.ReactNode {
    return (
      <Menu>
        <MenuItem
          text="Generate Improv Scenes..."
          icon="wrench"
          onClick={() => this._handleGenerateImprovScripts()}
        />
        <MenuDivider />
      </Menu>
    )
  }

  /**
   * Called on the user wants to show the editor's version.
   */
  private async _handleGenerateImprovScripts(): Promise<void> {
    //Alert.Show("Editor Version", `The version of the editor is: ${this.props.editor._packageJson.version}`);
    console.log('Generating improv scenes...')
    let file = await Tools.ShowOpenFileDialog('Select Improv Manifest')
    console.log(`selected file: ${file}`)
    let graphs = await generateGraphDataObjects(file) as any[]
    for (let graphData of graphs) {
      let graph = new LGraph()
      graph.configure(graphData, false)
    }
    console.log(`Generating improve scenes done...`)
  }
}
