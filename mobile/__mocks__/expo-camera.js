const React = require('react');
module.exports = {
  CameraView: (props) => React.createElement('View', props, props.children),
  useCameraPermissions: () => [{ granted: false }, jest.fn()],
};
