# Adds the CountlyDeviceTests UI test bundle to the test app's Xcode project, with a shared scheme that runs it.
#
# Usage: ruby add-test-target.rb <HelloWorld.xcodeproj> <test-bundle-id>
#
# A UI test bundle runs inside its own runner app, on the simulator under xcodebuild and on the phone in the device
# farm, so both run the same code. The tests start React Native in that runner app; they never launch HelloWorld.
# The folder CountlyDeviceTests next to the project holds CountlyDeviceTests.mm, main.jsbundle and scenarios.json.
require 'xcodeproj'

project_path, bundle_id = ARGV
abort('usage: ruby add-test-target.rb <project> <test-bundle-id>') unless project_path && bundle_id

project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |target| target.name == 'HelloWorld' }
abort('the project has no HelloWorld target') unless app

target = project.new_target(:ui_test_bundle, 'CountlyDeviceTests', :ios, '15.1', nil, :objc)
group = project.main_group.new_group('CountlyDeviceTests', 'CountlyDeviceTests')
target.add_file_references([group.new_reference('CountlyDeviceTests.mm')])
%w[main.jsbundle scenarios.json].each do |name|
  target.resources_build_phase.add_file_reference(group.new_reference(name))
end
target.add_dependency(app)
target.build_configurations.each do |config|
  settings = config.build_settings
  settings['PRODUCT_NAME'] = '$(TARGET_NAME)'
  settings['PRODUCT_BUNDLE_IDENTIFIER'] = bundle_id
  settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  settings['TEST_TARGET_NAME'] = 'HelloWorld'
  settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
  settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
end
project.save

scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.save_as(project_path, 'CountlyDeviceTests', true)
puts "Added CountlyDeviceTests (#{bundle_id}) to #{project_path}"
