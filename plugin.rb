# name: discourse-profile-widget
# about: A profile widget that works with discourse-layouts
# version: 0.1
# authors: Angus McLeod

register_asset 'stylesheets/user-widget.scss'

PLUGIN_NAME = "discourse-profile-widget".freeze

after_initialize do

	module ::DiscourseProfileWidget
		class Engine < ::Rails::Engine
			engine_name PLUGIN_NAME
			isolate_namespace DiscourseProfileWidget
		end
	end

	DiscourseLayouts::WidgetHelper.add_widget('profile')


	class DiscourseProfileWidget::ProfilewidgetController < ::ApplicationController
		skip_before_action :preload_json, :check_xhr

		def index
			user_id = params[:user_id].to_i

			user_stats = UserStat.where(user_id: user_id).first

			top = Group.where(name: 'top').first

			if( GroupUser.where(group_id: top.id, user_id: user_id).present? )
				is_top = true
			else
				is_top = false
			end

			result = {
				'credit' => user_stats.time_read,
				'is_top' => is_top
			}
			render json: result
			
		end
	end

	Discourse::Application.routes.prepend do
		mount ::DiscourseProfileWidget::Engine, at: "/discourseprofilewidget"
	end

	DiscourseProfileWidget::Engine.routes.draw do
		get "data.json" => "profilewidget#index"
	end
end
