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

	SiteSetting.class_eval do
		@choices[:layouts_sidebar_right_widgets].push('profile')
	end

	class DiscourseProfileWidget::ProfilewidgetController < ::ApplicationController
		skip_before_filter :preload_json, :check_xhr

		def index
			user_id = params[:user_id].to_i

			sql = sql = "SELECT * FROM user_stats WHERE user_id = #{user_id}"
			user_stats = ActiveRecord::Base.connection.execute(sql)
			read_time = user_stats[0]["time_read"]
			result = {
				'credit' => read_time
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
