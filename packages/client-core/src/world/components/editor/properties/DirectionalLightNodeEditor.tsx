import React, { Component } from "react";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import ColorInput from "../inputs/ColorInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import LightShadowProperties from "./LightShadowProperties";
import { Bolt } from "@styled-icons/fa-solid/Bolt";
import i18n from "i18next";
import { withTranslation } from "react-i18next";

/**
 * Defining properties for DirectionalLightNodeEditor.
 * 
 * @author Robert Long
 * @type {Object}
 */
type DirectionalLightNodeEditorProps = {
  editor?: object;
  node?: object;
  t?: Function;
};

/**
 * DirectionalLightNodeEditor is used provides  properties to customize DirectionaLight element.
 *
 *  @author Robert Long
 *  @type {Component class}
 */
export class DirectionalLightNodeEditor extends Component<
  DirectionalLightNodeEditorProps,
  {}
> {
  //defining icon component name
  static iconComponent = Bolt;

  //setting description and will appears on the node editor.
  static description = i18n.t('editor:properties.directionalLight.description');

  //function to handle changes in color property
  onChangeColor = color => {
    (this.props.editor as any).setPropertySelected("color", color);
  };
  //function to handle the changes in intensity property of DirectionalLight
  onChangeIntensity = intensity => {
    (this.props.editor as any).setPropertySelected("intensity", intensity);
  };

  // renders editor view, provides inputs to customize properties of DirectionalLight element.
  render() {
    DirectionalLightNodeEditor.description = this.props.t('editor:properties.directionalLight.description');
    const { node, editor } = this.props as any;
    return (
      <NodeEditor
        {...this.props}
        /* @ts-ignore */
        description={DirectionalLightNodeEditor.description}
      >
        { /* @ts-ignore */ }
        <InputGroup name="Color" label={this.props.t('editor:properties.directionalLight.lbl-color')}>
          { /* @ts-ignore */ }
          <ColorInput value={node.color} onChange={this.onChangeColor} />
        </InputGroup>
        { /* @ts-ignore */ }
        <NumericInputGroup
          name="Intensity"
          label={this.props.t('editor:properties.directionalLight.lbl-intensity')}
          min={0}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          value={node.intensity}
          onChange={this.onChangeIntensity}
          unit="cd"
        />
        <LightShadowProperties node={node} editor={editor} />
      </NodeEditor>
    );
  }
}

export default withTranslation()(DirectionalLightNodeEditor);