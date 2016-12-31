# name: discourse-profile-widget
# about: A profile widget that works with discourse-sidebar-widgets
# version: 0.1
# authors: Angus McLeod

register_asset 'stylesheets/user-widget.scss'

after_initialize do
  SiteSetting.class_eval do
    @choices[:sidebar_left_widgets].push('profile')
  end
end
