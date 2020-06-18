# frozen_string_literal: true

module RepositoryActions
  class ArchiveRowsService < ArchiveRowsBaseService
    def call
      return self unless valid?

      ActiveRecord::Base.transaction do
        # @repository_rows.each do |row|
        #   row.archive!(@user)
        #   log_activity(:archive_inventory_item, row)
        # end
        @repository_rows.bulk_archive!(@user)
        # log_activity(:archive_inventory_item, @repository_rows)
      rescue ActiveRecord::RecordNotSaved
        @errors[:archiving_error] = I18n.t('repositories.archive_records.unsuccess_flash', @repository.name)
        raise ActiveRecord::Rollback
      end

      self
    end

    private

    def scoped_repository_rows(ids)
      @repository.repository_rows.where(id: ids).active
    end
  end
end
